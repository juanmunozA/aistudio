import type { Request, Response } from 'express';
import { documentService } from '../services/documentService.js';
import { HttpError } from '../utils/httpError.js';

export const documentController = {
  async extractText(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('Debe adjuntar un archivo en el campo "file"');
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const text = await documentService.extractText(fileName, req.file.buffer);
    res.json({ fileName, text });
  },
};
