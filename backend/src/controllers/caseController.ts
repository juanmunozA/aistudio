import type { Request, Response } from 'express';
import { currentUser } from '../middlewares/authenticate.js';
import type { CreateCaseInput, UpdateCaseInput } from '../models/case.js';
import { caseService } from '../services/caseService.js';

const idOf = (req: Request) => String(req.params.id);

export const caseController = {
  async list(req: Request, res: Response) {
    res.json({ cases: await caseService.list(currentUser(req)) });
  },

  async get(req: Request, res: Response) {
    res.json({ case: await caseService.get(currentUser(req), idOf(req)) });
  },

  async create(req: Request, res: Response) {
    res.status(201).json({ case: await caseService.create(currentUser(req), req.body as CreateCaseInput) });
  },

  async update(req: Request, res: Response) {
    res.json({ case: await caseService.update(currentUser(req), idOf(req), req.body as UpdateCaseInput) });
  },

  async remove(req: Request, res: Response) {
    await caseService.remove(currentUser(req), idOf(req));
    res.status(204).end();
  },

  async history(req: Request, res: Response) {
    res.json({ history: await caseService.history(currentUser(req), idOf(req)) });
  },

  normalize(req: Request, res: Response) {
    res.json({ state: caseService.normalize(req.body as CreateCaseInput) });
  },
};
