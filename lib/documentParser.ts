import { getDocumentProxy, extractText } from 'unpdf';
import * as mammoth from 'mammoth';

/**
 * Extracts text from a DOCX file
 */
export async function extractTextFromDOCX(file: Buffer | Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(file) });
    return result.value.trim();
  } catch (error: any) {
    throw new Error(`DOCX Parsing Error: ${error.message}`);
  }
}

/**
 * Extracts text content from a PDF file
 */
export async function extractTextFromPDF(file: Buffer | Uint8Array): Promise<string> {
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.length > MAX_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  try {
    const uint8Array = file instanceof Uint8Array ? file : new Uint8Array(file);
    const pdf = await getDocumentProxy(uint8Array);
    const { text } = await extractText(pdf, { mergePages: true });

    const cleanedText = text.replace(/\s+/g, ' ').trim();

    if (!cleanedText) {
      throw new Error('PDF appears to be empty or contains no extractable text');
    }

    return cleanedText;
  } catch (error: any) {
    console.error('PDF Parsing Error:', error);
    if (error.name === 'PasswordException') {
      throw new Error('Password-protected PDFs are not supported');
    }
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * General function to extract text based on file type
 */
export async function extractTextFromFile(file: Buffer | Uint8Array, fileName: string): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') {
    return extractTextFromPDF(file);
  } else if (extension === 'docx' || extension === 'doc') {
    return extractTextFromDOCX(file);
  } else {
    throw new Error(`Unsupported file type: .${extension}`);
  }
}
