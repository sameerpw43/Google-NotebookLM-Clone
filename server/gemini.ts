// Following blueprint: javascript_gemini
import { GoogleGenAI } from "@google/genai";
import type { PageCitation } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ChatWithPDFParams {
  question: string;
  pdfContext: string;
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>;
}

interface ChatResponse {
  answer: string;
  citations: PageCitation[];
}

export async function chatWithPDF({ 
  question, 
  pdfContext, 
  conversationHistory 
}: ChatWithPDFParams): Promise<ChatResponse> {
  try {
    const systemPrompt = `You are an AI assistant helping users understand PDF documents. 
Your task is to answer questions based on the provided PDF content.

IMPORTANT INSTRUCTIONS:
1. Answer questions accurately based on the PDF content provided
2. Include page citations in your response when referencing specific information
3. Format citations as [Page X] where X is the page number
4. Be concise but thorough
5. If the answer is not in the PDF, say so clearly
6. Use the conversation history for context but prioritize the PDF content

PDF CONTENT:
${pdfContext}

When you cite information, use this format: [Page X] where X is the actual page number.
Extract and return all page citations from your response.`;

    // Build conversation contents
    const contents = [
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: question }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents,
    });

    const answer = response.text || "I couldn't generate a response. Please try again.";

    // Extract citations from the response
    const citations = extractCitations(answer);

    return { answer, citations };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate response: ${error}`);
  }
}

// Streaming version for real-time responses
export async function* chatWithPDFStream({ 
  question, 
  pdfContext, 
  conversationHistory 
}: ChatWithPDFParams): AsyncGenerator<string, { citations: PageCitation[] }, undefined> {
  try {
    const systemPrompt = `You are an AI assistant helping users understand PDF documents. 
Your task is to answer questions based on the provided PDF content.

IMPORTANT INSTRUCTIONS:
1. Answer questions accurately based on the PDF content provided
2. Include page citations in your response when referencing specific information
3. Format citations as [Page X] where X is the page number
4. Be concise but thorough
5. If the answer is not in the PDF, say so clearly
6. Use the conversation history for context but prioritize the PDF content

PDF CONTENT:
${pdfContext}

When you cite information, use this format: [Page X] where X is the actual page number.
Extract and return all page citations from your response.`;

    // Build conversation contents
    const contents = [
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: question }],
      },
    ];

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
      },
      contents,
    });

    let fullText = '';
    
    for await (const chunk of response.stream) {
      const chunkText = chunk.text || '';
      fullText += chunkText;
      yield chunkText;
    }

    // Extract citations from the full response
    const citations = extractCitations(fullText);

    return { citations };
  } catch (error) {
    console.error('Gemini API streaming error:', error);
    throw new Error(`Failed to generate streaming response: ${error}`);
  }
}

function extractCitations(text: string): PageCitation[] {
  const citationRegex = /\[Page (\d+)\]/g;
  const citations: PageCitation[] = [];
  const seen = new Set<number>();

  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const page = parseInt(match[1], 10);
    if (!seen.has(page)) {
      seen.add(page);
      citations.push({ page, text: match[0] });
    }
  }

  return citations.sort((a, b) => a.page - b.page);
}

// Helper function to chunk PDF text intelligently
export function chunkPDFText(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
      } else {
        // Paragraph itself is too long, split by sentences
        const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
          } else {
            currentChunk += sentence;
          }
        }
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
