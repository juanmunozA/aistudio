import type { Request, Response } from 'express';
import { currentUser } from '../middlewares/authenticate.js';
import type { LoginInput } from '../models/user.js';
import { authService } from '../services/authService.js';

export const authController = {
  async login(req: Request, res: Response) {
    res.json(await authService.login(req.body as LoginInput));
  },

  async refresh(req: Request, res: Response) {
    res.json(await authService.refresh(currentUser(req)));
  },

  me(req: Request, res: Response) {
    res.json({ user: currentUser(req) });
  },
};
