import type { Request, Response } from 'express';
import { z } from 'zod';
import { currentUser } from '../middlewares/authenticate.js';
import { attachmentService } from '../services/attachmentService.js';
import { HttpError } from '../utils/httpError.js';

const signedQuerySchema = z.object({
  expires: z.coerce.number().int().positive(),
  signature: z.string().min(1).max(200),
});

export const attachmentController = {
  async upload(req: Request, res: Response) {
    if (!req.file) throw HttpError.badRequest('Debe adjuntar una imagen en el campo "file"');
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    res.status(201).json({ attachment: await attachmentService.uploadImage(currentUser(req), fileName, req.file.buffer) });
  },

  async sign(req: Request, res: Response) {
    res.json({ attachment: await attachmentService.sign(currentUser(req), String(req.params.id)) });
  },

  /** Entrega el archivo con una URL firmada (las etiquetas <img> no envían el token de sesión). */
  async content(req: Request, res: Response) {
    const query = signedQuerySchema.safeParse(req.query);
    if (!query.success) throw HttpError.forbidden('URL de adjunto inválida');
    const { attachment, content } = await attachmentService.readSigned(String(req.params.id), query.data.expires, query.data.signature);
    res.setHeader('Content-Type', attachment.contentType);
    res.setHeader('Cache-Control', 'private, max-age=600');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.send(content);
  },

  async remove(req: Request, res: Response) {
    await attachmentService.remove(currentUser(req), String(req.params.id));
    res.status(204).end();
  },
};
