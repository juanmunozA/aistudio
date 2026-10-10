import mammoth from 'mammoth';
import * as XLSX from '@e965/xlsx';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const textDecoder = new TextDecoder();

async function extractPdf(buffer: Buffer): Promise<string> {
  const loadingTask = getDocument({ data: new Uint8Array(buffer), useSystemFonts: true });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n';
  }
  await loadingTask.destroy();
  return text;
}

function extractSpreadsheet(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames.map((sheetName) => XLSX.utils.sheet_to_txt(workbook.Sheets[sheetName]!) + '\n').join('');
}

export const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'xls', 'md', 'txt'];

/** Extrae el texto de las evidencias que sube el usuario para enviárselo a la IA. */
export const documentService = {
  async extractText(fileName: string, buffer: Buffer): Promise<string> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return extractPdf(buffer);
    if (extension === 'docx') return (await mammoth.extractRawText({ buffer })).value;
    if (extension === 'xlsx' || extension === 'xls') return extractSpreadsheet(buffer);
    return textDecoder.decode(buffer);
  },
};
