// Following blueprint: javascript_database
import { 
  pdfs, 
  chatSessions, 
  chatMessages,
  type Pdf, 
  type InsertPdf,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // PDF operations
  createPdf(pdf: InsertPdf): Promise<Pdf>;
  getPdf(id: string): Promise<Pdf | undefined>;
  updatePdfContent(id: string, textContent: string): Promise<void>;
  
  // Chat session operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: string): Promise<ChatSession | undefined>;
  updateChatSession(id: string): Promise<void>;
  
  // Chat message operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  clearChatMessages(sessionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createPdf(insertPdf: InsertPdf): Promise<Pdf> {
    const [pdf] = await db
      .insert(pdfs)
      .values(insertPdf)
      .returning();
    return pdf;
  }

  async getPdf(id: string): Promise<Pdf | undefined> {
    const [pdf] = await db.select().from(pdfs).where(eq(pdfs.id, id));
    return pdf || undefined;
  }

  async updatePdfContent(id: string, textContent: string): Promise<void> {
    await db
      .update(pdfs)
      .set({ textContent })
      .where(eq(pdfs.id, id));
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getChatSession(id: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async updateChatSession(id: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, id));
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.createdAt);
    return messages;
  }

  async clearChatMessages(sessionId: string): Promise<void> {
    await db
      .delete(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
