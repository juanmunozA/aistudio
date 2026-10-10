import type { Request, Response } from 'express';
import { aiOperations, type AiOperationName } from '../ai/operations.js';
import { aiService, type AiRequest } from '../services/aiService.js';
import { HttpError } from '../utils/httpError.js';

export const aiController = {
  async run(req: Request, res: Response) {
    const operation = String(req.params.operation);
    if (!Object.hasOwn(aiOperations, operation)) throw HttpError.notFound(`Operación de IA desconocida: ${operation}`);
    const data = await aiService.run(operation as AiOperationName, req.body as AiRequest);
    res.json({ data });
  },
};
