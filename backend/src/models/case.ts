import { z } from 'zod';

/** Estado completo del análisis (el mismo objeto que hoy se exporta en JSON). */
export type CaseState = Record<string, unknown>;

export interface Case {
  id: string;
  ownerSub: string;
  name: string;
  status: string;
  state: CaseState;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CaseSummary = Omit<Case, 'state'>;

export interface CaseHistoryEntry {
  version: number;
  changedBy: string;
  action: 'created' | 'updated';
  changedSections: string[];
  createdAt: Date;
}

const caseStateSchema = z.record(z.string(), z.unknown());

export const caseIdParamsSchema = z.object({
  id: z.uuid(),
});

export const createCaseSchema = z.object({
  state: caseStateSchema,
});

export const updateCaseSchema = z.object({
  state: caseStateSchema,
  /** Versión sobre la que el cliente hizo los cambios (control de concurrencia optimista). */
  version: z.number().int().positive(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
