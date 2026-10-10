import type { Request, Response } from 'express';
import { z } from 'zod';
import { buildExport, EXPORT_TYPES, type ExportType } from '../services/exportService.js';
import { HttpError } from '../utils/httpError.js';

export const exportRequestSchema = z.object({
  state: z.record(z.string(), z.unknown()),
  /** Fecha y hora de generación en el formato local del usuario. */
  generatedAt: z.string().max(100).default(''),
});

export const exportController = {
  excel(req: Request, res: Response) {
    const type = String(req.params.type) as ExportType;
    if (!EXPORT_TYPES.includes(type)) throw HttpError.notFound(`Reporte desconocido: ${type}`);
    const body = req.body as z.infer<typeof exportRequestSchema>;
    const { fileName, content } = buildExport(type, body.state, body.generatedAt);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(content);
  },
};
