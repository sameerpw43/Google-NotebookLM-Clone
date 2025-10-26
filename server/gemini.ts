// gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { PageCitation } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface ChatWithPDFParams {
  question: string;
  pdfContext: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

interface ChatResponse {
  answer: string;
  citations: PageCitation[];
}

export async function chatWithPDF({
  question,
  pdfContext,
  conversationHistory,
}: ChatWithPDFParams): Promise<ChatResponse> {
  const systemPrompt = `You are an AI assistant helping users understand PDF documents. 
Your task is to answer questions based ONLY on the provided PDF content.

IMPORTANT INSTRUCTIONS:
1. Answer questions accurately based on the PDF content provided below
2. Include page citations in your response when referencing specific information
3. Format citations as [Page X] where X is the page number
4. Be concise but thorough
5. If the answer is not in the PDF, say "I cannot find this information in the provided PDF document"
6. Use the conversation history for context but prioritize the PDF content
7. Always base your answers on the PDF content provided

PDF CONTENT:
${pdfContext}

When you cite information, use this format: [Page X] where X is the actual page number.`;

  // Build prompt with history (kept as your logic)
  let prompt = question;
  if (conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    prompt = `Previous conversation:\n${historyText}\n\nCurrent question: ${question}`;
  }

  const resp = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    // include the system prompt in the contents since `systemInstruction` is not a recognized parameter
    contents: `${systemPrompt}\n\n${prompt}`, // strings are accepted; SDK wraps as Content[]
  });

  const answer = resp.text || "I couldn't generate a response. Please try again.";
  const citations = extractCitations(answer);
  return { answer, citations };
}

// Streaming version
export async function* chatWithPDFStream({
  question,
  pdfContext,
  conversationHistory,
}: ChatWithPDFParams): AsyncGenerator<string, { citations: PageCitation[] }, undefined> {
  console.log('=== AI STREAMING DEBUG ===');
  console.log('Question:', question);
  console.log('PDF Context length:', pdfContext.length);
  console.log('PDF Context preview:', pdfContext.substring(0, 500));
  console.log('Conversation history length:', conversationHistory.length);

  const systemPrompt = `You are an AI assistant helping users understand PDF documents. 
Your task is to answer questions based ONLY on the provided PDF content.

IMPORTANT INSTRUCTIONS:
1. Answer questions accurately based on the PDF content provided below
2. Include page citations in your response when referencing specific information
3. Format citations as [Page X] where X is the page number
4. Be concise but thorough
5. If the answer is not in the PDF, say "I cannot find this information in the provided PDF document"
6. Use the conversation history for context but prioritize the PDF content
7. Always base your answers on the PDF content provided

PDF CONTENT:
${pdfContext}

When you cite information, use this format: [Page X] where X is the actual page number.`;

  let prompt = question;
  if (conversationHistory.length > 0) {
    const historyText = conversationHistory
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
    prompt = `Previous conversation:\n${historyText}\n\nCurrent question: ${question}`;
  }

  console.log('Final prompt being sent to AI:', prompt.substring(0, 300));

  const stream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    // include the system prompt in the contents since `systemInstruction` is not a recognized parameter
    contents: `${systemPrompt}\n\n${prompt}`,
  });

  let fullText = "";
  // IMPORTANT: iterate the stream directly (no `.stream`)
  for await (const chunk of stream) {
    const chunkText = chunk.text ?? "";
    fullText += chunkText;
    yield chunkText;
  }

  const citations = extractCitations(fullText);
  return { citations };
}

function extractCitations(text: string): PageCitation[] {
  const citationRegex = /\[Page (\d+)\]/g;
  const seen = new Set<number>();
  const out: PageCitation[] = [];
  let m;
  while ((m = citationRegex.exec(text)) !== null) {
    const page = Number(m[1]);
    if (!seen.has(page)) {
      seen.add(page);
      out.push({ page, text: m[0] });
    }
  }
  return out.sort((a, b) => a.page - b.page);
}

// gemini.ts (add near the bottom, and ensure it's exported)
export function chunkPDFText(text: string, maxChunkSize = 8000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let current = "";

  for (const p of paragraphs) {
    if ((current + (current ? "\n\n" : "") + p).length > maxChunkSize) {
      if (current) {
        chunks.push(current.trim());
        current = p;
      } else {
        // Paragraph itself too long → split by sentence-ish boundaries
        const sentences = p.match(/[^.!?]+[.!?]+|\S+/g) || [p];
        for (const s of sentences) {
          if ((current + s).length > maxChunkSize) {
            if (current) chunks.push(current.trim());
            current = s;
          } else {
            current += (current ? " " : "") + s;
          }
        }
      }
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
