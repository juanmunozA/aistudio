import { documentsApi } from '../../services/api/documentsApi';

// Lector de archivos compartido: el texto lo extrae el backend.
export const extractTextFromFile = async (file: File): Promise<string> => {
  try {
    return await documentsApi.extractText(file);
  } catch (error) {
    console.error('Error extracting text:', error);
    try {
      return await file.text();
    } catch (innerError) {
      console.error('Fallback text extraction failed:', innerError);
      return '';
    }
  }
};
