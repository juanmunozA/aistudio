import { apiRequest } from './httpClient';

export const documentsApi = {
  /** El backend extrae el texto de PDF, DOCX, XLSX, MD y TXT. */
  extractText: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await apiRequest<{ text: string }>('/documents/extract-text', { method: 'POST', formData });
    return result.text;
  },
};
