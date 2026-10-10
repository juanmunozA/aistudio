import type { Request, Response } from 'express';
import { aiOperations, type AiOperationName } from '../ai/operations.js';
import { aiService, type AiRequest } from '../services/aiService.js';
import { buildAcpPlans } from '../domain/d5Service.js';
import type { AcpPlansRequest } from '../models/domain.js';
import { HttpError } from '../utils/httpError.js';

export const aiController = {
  async run(req: Request, res: Response) {
    const operation = String(req.params.operation);
    if (!Object.hasOwn(aiOperations, operation)) throw HttpError.notFound(`Operación de IA desconocida: ${operation}`);
    const data = await aiService.run(operation as AiOperationName, req.body as AiRequest);
    res.json({ data });
  },

  /** D5 sin IA: arma los planes ACP con las acciones ya generadas en D4. */
  acpPlans(req: Request, res: Response) {
    const body = req.body as AcpPlansRequest;
    const ctx = {
      language: body.language,
      clientToday: body.clientToday ?? new Date().toISOString().split('T')[0]!,
      setup: { type: body.setup.type ?? undefined, caseName: body.setup.caseName ?? undefined, responsible: body.setup.responsible ?? undefined },
    };
    res.json({ data: { acpPlans: buildAcpPlans(ctx, body.d4, body.d4.secondaryActions) } });
  },
};
