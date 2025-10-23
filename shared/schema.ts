import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// PDF Documents table
export const pdfs = pgTable("pdfs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  pageCount: integer("page_count").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  textContent: text("text_content"),
});

// Chat sessions table
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pdfId: varchar("pdf_id").notNull().references(() => pdfs.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  citations: jsonb("citations").$type<PageCitation[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema types
export const insertPdfSchema = createInsertSchema(pdfs).omit({
  id: true,
  uploadedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertPdf = z.infer<typeof insertPdfSchema>;
export type Pdf = typeof pdfs.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Additional types for frontend
export interface PageCitation {
  page: number;
  text: string;
}

export interface ChatRequest {
  sessionId: string;
  question: string;
}

export interface ChatResponse {
  message: ChatMessage;
}

export interface UploadResponse {
  pdf: Pdf;
  session: ChatSession;
}
