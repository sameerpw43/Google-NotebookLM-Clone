import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { processPDF, ensureUploadDir, getPDFPath } from "./pdfProcessor";
import { chatWithPDF, chatWithPDFStream, chunkPDFText } from "./gemini";
import { insertPdfSchema, insertChatMessageSchema } from "@shared/schema";
import type { ChatRequest, PageCitation } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure upload directory exists
  await ensureUploadDir();

  // Upload PDF and create chat session
  app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const metadata = await processPDF(file.path);

      // Create PDF record
      const pdf = await storage.createPdf({
        filename: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        pageCount: metadata.pageCount,
        textContent: metadata.textContent,
      });

      // Create chat session
      const session = await storage.createChatSession({
        pdfId: pdf.id,
      });

      res.json({ pdf, session });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload PDF' });
    }
  });

  // Get PDF file
  app.get('/api/pdfs/:id/file', async (req, res) => {
    try {
      const pdf = await storage.getPdf(req.params.id);
      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      const filePath = getPDFPath(pdf.filename);
      res.sendFile(filePath);
    } catch (error: any) {
      console.error('Get PDF error:', error);
      res.status(500).json({ error: 'Failed to retrieve PDF' });
    }
  });

  // Get chat messages
  app.get('/api/chat/:sessionId/messages', async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.sessionId);
      res.json(messages);
    } catch (error: any) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  });

  // Send chat message
  app.post('/api/chat', async (req, res) => {
    try {
      // Validate and sanitize request body - strip unknown fields
      const chatRequestSchema = z.object({
        sessionId: z.string().uuid(),
        question: z.string().min(1).max(5000),
      }).strict();
      
      const validation = chatRequestSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request data', details: validation.error });
      }

      const { sessionId, question } = validation.data;

      // Get session and PDF
      const session = await storage.getChatSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const pdf = await storage.getPdf(session.pdfId);
      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      // Get conversation history
      const existingMessages = await storage.getChatMessages(sessionId);
      const conversationHistory = existingMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Save user message
      await storage.createChatMessage({
        sessionId,
        role: 'user',
        content: question,
        citations: null,
      });

      // Debug: Log PDF text content availability
      console.log('PDF text content length:', pdf.textContent?.length || 0);
      console.log('PDF text preview:', pdf.textContent?.substring(0, 200) || 'No text content');

      // Chunk PDF text intelligently to optimize token usage
      const chunks = chunkPDFText(pdf.textContent || '', 4000);
      console.log('Number of chunks created:', chunks.length);
      
      // Simple relevance scoring: find chunks containing question keywords
      const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      const scoredChunks = chunks.map((chunk, index) => {
        const chunkLower = chunk.toLowerCase();
        const score = questionWords.reduce((sum, word) => {
          const count = (chunkLower.match(new RegExp(word, 'g')) || []).length;
          return sum + count;
        }, 0);
        return { chunk, score, index };
      });
      
      // Sort by relevance and take top 3 chunks, maintaining some context order
      const relevantChunks = scoredChunks
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .sort((a, b) => a.index - b.index)
        .map(c => c.chunk);
      
      const pdfContext = relevantChunks.length > 0 
        ? relevantChunks.join('\n\n---\n\n')
        : chunks.slice(0, 2).join('\n\n---\n\n');

      console.log('PDF context length being sent to AI:', pdfContext.length);
      console.log('PDF context preview:', pdfContext.substring(0, 300));

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullAnswer = '';
      let citations: PageCitation[] = [];

      try {
        // Stream AI response and capture citations
        const stream = chatWithPDFStream({
          question,
          pdfContext,
          conversationHistory,
        });

        // Manually iterate to capture both yielded chunks and return value
        let result: { citations: PageCitation[] } | undefined;
        
        while (true) {
          const { value, done } = await stream.next();
          
          if (done) {
            // Capture the return value containing citations
            result = value;
            break;
          }
          
          // Stream the chunk to client
          fullAnswer += value;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: value })}\n\n`);
        }

        // Extract citations from return value
        citations = result?.citations || [];

        // Save assistant message with citations
        const assistantMessage = await storage.createChatMessage({
          sessionId,
          role: 'assistant',
          content: fullAnswer,
          citations: citations.length > 0 ? citations : null,
        });

        // Send complete message
        res.write(`data: ${JSON.stringify({ type: 'complete', message: assistantMessage })}\n\n`);
        res.end();

        // Update session timestamp
        await storage.updateChatSession(sessionId);
      } catch (streamError: any) {
        console.error('Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ type: 'error', error: streamError.message })}\n\n`);
        res.end();
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Failed to process chat message' });
      }
    }
  });

  // Clear chat messages
  app.delete('/api/chat/:sessionId/clear', async (req, res) => {
    try {
      await storage.clearChatMessages(req.params.sessionId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Clear chat error:', error);
      res.status(500).json({ error: 'Failed to clear chat' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
