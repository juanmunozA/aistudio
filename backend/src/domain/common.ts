import type { Language } from '../ai/prompts/templates.js';

export interface DomainContext {
  language: Language;
  /** Fecha local del usuario (YYYY-MM-DD): las fechas "de hoy" se muestran en su zona horaria. */
  clientToday: string;
  setup: { type?: string; caseName?: string; responsible?: string };
}

/** Fecha en N días contados desde hoy (UTC), como la calculaba el frontend. */
export const dateInDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

/** Fecha UTC de hoy (YYYY-MM-DD). */
export const utcToday = () => new Date().toISOString().split('T')[0]!;

export const randomSuffix = () => Math.random().toString(36).substring(2, 11);

/** Número del caso: dígitos al inicio del nombre (por ejemplo "4235 Falla en empaque" → "4235"). */
export const caseNumberOf = (caseName?: string) => caseName?.match(/^\d+/)?.[0] ?? '';

export const AUDIT_CASE_TYPE = 'Hallazgo de Auditoría, ACPM';
export const IMPROVEMENT_CASE_TYPE = 'Oportunidad de mejora';

/** La IA a veces devuelve las acciones en formas distintas: se normalizan a una lista de textos. */
export function extractActionList(data: unknown): unknown[] {
  const value = data as { results?: { actions?: unknown[] }[]; actions?: unknown[] } | null;
  if (Array.isArray(value?.results?.[0]?.actions)) return value!.results![0]!.actions!;
  if (Array.isArray(value?.actions)) return value!.actions!;
  if (Array.isArray(value?.results)) return value!.results!.flatMap((r) => r.actions || []);
  return [];
}

export const actionText = (item: unknown): string => {
  if (typeof item === 'string') return item;
  const obj = item as { action?: string; text?: string } | null;
  return obj?.action || obj?.text || String(item);
};
