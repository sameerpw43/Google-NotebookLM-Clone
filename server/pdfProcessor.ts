import { PDFParse } from 'pdf-parse';
import fs from 'fs';
import path from 'path';
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

    // Use the PDFParse class
    const pdfParser = new PDFParse({ data: dataBuffer });
    const textResult = await pdfParser.getText();
    const infoResult = await pdfParser.getInfo();

    const fullText = textResult.text;
    const pageCount = infoResult.total;

    console.log('PDF processing - Page count:', pageCount);
    console.log('PDF processing - Text length:', fullText.length);
    console.log('PDF processing - Text preview:', fullText.substring(0, 300));

    // Extract text by page for better citation support
    const textByPage = new Map<number, string>();

    // Better approach: Split text into roughly equal chunks and add page markers
    const avgCharsPerPage = Math.ceil(fullText.length / pageCount);
    let formattedText = '';

    for (let i = 1; i <= pageCount; i++) {
      const startIdx = (i - 1) * avgCharsPerPage;
      const endIdx = Math.min(i * avgCharsPerPage, fullText.length);
      const pageText = fullText.substring(startIdx, endIdx);
      
      // Clean up the text and add page marker
      const cleanPageText = pageText.trim();
      const pageWithMarker = `[Page ${i}]\n${cleanPageText}`;
      
      textByPage.set(i, pageWithMarker);
      formattedText += (i > 1 ? '\n\n' : '') + pageWithMarker;
    }

    return {
      pageCount,
      textContent: formattedText, // Use formatted text with page markers
      textByPage,
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error(`Failed to process PDF file: ${error.message}`);
  }
}

export function getUploadPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

export function getPDFPath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}