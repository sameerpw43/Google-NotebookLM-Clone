import * as pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export interface PDFMetadata {
  pageCount: number;
  textContent: string;
  textByPage: Map<number, string>;
}

export async function processPDF(filePath: string): Promise<PDFMetadata> {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await (pdfParse as any).default(dataBuffer);

    // Extract text by page for better citation support
    const textByPage = new Map<number, string>();
    
    // pdf-parse doesn't provide per-page text directly, so we'll use the full text
    // and mark it with page references during chunking
    const fullText = data.text;
    const pageCount = data.numpages;

    // Estimate text per page (rough approximation)
    const avgCharsPerPage = Math.ceil(fullText.length / pageCount);
    
    for (let i = 1; i <= pageCount; i++) {
      const startIdx = (i - 1) * avgCharsPerPage;
      const endIdx = Math.min(i * avgCharsPerPage, fullText.length);
      const pageText = fullText.substring(startIdx, endIdx);
      textByPage.set(i, `[Page ${i}]\n${pageText}`);
    }

    return {
      pageCount,
      textContent: fullText,
      textByPage,
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file');
  }
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function getPDFPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}
