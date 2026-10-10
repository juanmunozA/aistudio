import { z } from 'zod';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  isActive: boolean;
}

/** Usuario autenticado tal como lo ve el resto del backend. */
export interface AuthUser {
  sub: string;
  username: string;
  displayName: string;
}

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
