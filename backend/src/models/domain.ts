import { z } from 'zod';
import type { ActionStep, FiveWhysAnalysis } from '../domain/types.js';

export const acpPlansRequestSchema = z.object({
  language: z.enum(['es', 'en']).default('es'),
  clientToday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  setup: z.object({ type: z.string().nullish(), caseName: z.string().nullish(), responsible: z.string().nullish() }).default({}),
  d4: z.object({
    fixedRootCauseIds: z.array(z.string()).default([]),
    fiveWhysHistory: z
      .array(z.unknown())
      .default([])
      .transform((items) => items as FiveWhysAnalysis[]),
    syntheticCause: z
      .object({ id: z.string(), text: z.string() })
      .nullish()
      .transform((value) => value ?? null),
    secondaryActions: z
      .record(z.string(), z.unknown())
      .default({})
      .transform((value) => value as Record<string, ActionStep[]>),
    primaryCauseId: z
      .string()
      .nullish()
      .transform((value) => value ?? null),
  }),
});

export type AcpPlansRequest = z.infer<typeof acpPlansRequestSchema>;
