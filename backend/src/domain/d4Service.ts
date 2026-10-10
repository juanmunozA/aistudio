import type { Language } from '../ai/prompts/templates.js';
import { dateInDays, randomSuffix } from './common.js';
import { ishikawaCategories, text } from './texts.js';
import type { ActionStep, FiveWhysAnalysis, FiveWhyStep, GembaDiagnostic, Hypothesis, ObservationValue, SyntheticCause } from './types.js';

const MAX_CAUSES_PER_CATEGORY = 4;

/** Hipótesis fijadas por el usuario (las que se conservan al regenerar el Ishikawa). */
export const selectedHypotheses = (hypotheses: Hypothesis[], selectedIds: string[]) =>
  hypotheses.filter((h) => selectedIds.includes(h.id));

/**
 * Ishikawa 6M: por categoría conserva las causas fijadas, agrega las nuevas de la IA sin
 * duplicados hasta completar 4 y rellena con causas editables si faltan.
 */
export function mergeIshikawa(
  language: Language,
  incoming: Partial<Hypothesis>[],
  current: Hypothesis[],
  selectedIds: string[],
): Hypothesis[] {
  const stamp = Date.now();
  const next: Hypothesis[] = [];

  for (const category of ishikawaCategories[language]) {
    const slug = category.replace(/\s+/g, '');
    const merged = current.filter((h) => h.category === category && selectedIds.includes(h.id));
    const fromAi = incoming
      .filter((h) => h && h.category === category)
      .map((h, i) => ({ id: `h-${stamp}-${slug}-${i}`, category, text: h.text || '' }));

    for (const candidate of fromAi) {
      if (merged.length >= MAX_CAUSES_PER_CATEGORY) break;
      const duplicate = merged.some((m) => m.text.trim().toLowerCase() === candidate.text.trim().toLowerCase());
      if (!duplicate) merged.push(candidate);
    }
    while (merged.length < MAX_CAUSES_PER_CATEGORY) {
      merged.push({ id: `h-manual-${stamp}-${slug}-${merged.length}`, category, text: text(language, 'additionalPotentialCause') });
    }
    next.push(...merged);
  }
  return next;
}

/** Checklist Gemba: arma los diagnósticos y deja sin responder las preguntas de causas nuevas. */
export function buildGemba(
  incoming: Partial<GembaDiagnostic>[],
  currentChecks: Record<string, ObservationValue[]>,
): { gembaDiagnostics: GembaDiagnostic[]; observationChecks: Record<string, ObservationValue[]> } {
  const observationChecks = { ...currentChecks };
  const gembaDiagnostics = incoming.map((diagnostic) => {
    const questions = diagnostic.questions || [];
    if (diagnostic.hypothesisId && !observationChecks[diagnostic.hypothesisId]) {
      observationChecks[diagnostic.hypothesisId] = questions.map(() => null);
    }
    return { hypothesisId: diagnostic.hypothesisId || `diag-${Date.now()}`, cause: diagnostic.cause || '', questions };
  });
  return { gembaDiagnostics, observationChecks };
}

/**
 * Evaluación del Gemba: una causa queda confirmada cuando se respondió al menos una
 * pregunta y el 50% o más de las preguntas resultaron "NO" (no cumple el estándar).
 */
export function confirmedByGemba(diagnostics: GembaDiagnostic[], checks: Record<string, ObservationValue[]>): GembaDiagnostic[] {
  return diagnostics.filter((diagnostic) => {
    const answers = checks[diagnostic.hypothesisId] || [];
    const noCount = answers.filter((value) => value === 'no').length;
    return answers.filter((value) => value !== null).length > 0 && noCount / (diagnostic.questions?.length || 1) >= 0.5;
  });
}

export function buildFiveWhys(targetCause: string, data: { whys?: FiveWhyStep[]; causa_raiz_sistemica?: string }): FiveWhysAnalysis {
  return {
    id: `5w-${Date.now()}-${randomSuffix()}`,
    targetCause,
    whys: data?.whys || [],
    systemicRootCause: data?.causa_raiz_sistemica || '',
  };
}

/** Texto de cada causa raíz fijada (la causa sintética o la causa sistémica de su análisis de 5 porqués). */
export function fixedRootCauses(
  fixedIds: string[],
  history: FiveWhysAnalysis[],
  syntheticCause: SyntheticCause | null | undefined,
): { id: string; text: string }[] {
  return fixedIds.map((id) => {
    if (id.startsWith('synth-')) return { id, text: syntheticCause?.text || '' };
    return { id, text: history.find((analysis) => analysis.id === id)?.systemicRootCause || '' };
  });
}

export function buildSyntheticCause(language: Language, data: { synthetic_cause?: string }): SyntheticCause {
  return { id: `synth-${Date.now()}`, text: data?.synthetic_cause || text(language, 'failureModeDefault') };
}

/** Acciones definitivas por causa raíz fijada, con responsable y fechas por defecto. */
export function buildSecondaryActions(
  language: Language,
  data: { results?: { hypothesisId?: string; actions?: string[] }[] },
  fixedIds: string[],
  current: Record<string, ActionStep[]>,
): Record<string, ActionStep[]> {
  const actionMap = { ...current };
  const defaultDate = dateInDays(30);
  const leader = text(language, 'areaLeader');

  for (const result of data?.results || []) {
    if (!result?.hypothesisId) continue;
    const matchingId = fixedIds.find((id) => String(id) === String(result.hypothesisId));
    if (!matchingId) continue;
    actionMap[matchingId] = (result.actions || []).map((action, index) => ({
      id: `action-${matchingId}-${index}-${Date.now()}`,
      action,
      evidenceHow: '',
      evidenceDate: defaultDate,
      evidenceResponsible: leader,
      verificationHow: '',
      responsible: leader,
      timeframe: defaultDate,
      isFixed: false,
    }));
  }
  return actionMap;
}
