import type { CaseState } from '../models/case.js';
import { HttpError } from '../utils/httpError.js';

type Json = Record<string, any>;

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const DEFAULT_COST_INPUTS = {
  manoDeObra: '',
  materiaPrima: '',
  materialEmpaque: '',
  recorte: '',
  desperdicio: '',
  productoTerminado: '',
  logisticos: '',
  ensayosPruebas: '',
  otros: '',
  maquinariaEquipos: '',
  infraestructura: '',
  lucroCesante: '',
};

/** Estado inicial de un caso: mismo contenido que INITIAL_STATE del frontend. */
export function createInitialState(): Json {
  return {
    language: 'es',
    setup: {
      startDate: today(),
      caseName: '',
      responsible: '',
      type: 'Desviación de proceso',
      impact: ['Calidad'],
      standards: [],
      otherStandard: '',
      otherImpact: '',
    },
    d2: { fieldDataInput: '', images: [], phenomenon: '', analysis: '' },
    costs: { currency: 'COP', totalLoss: '', breakdown: [], inputs: { ...DEFAULT_COST_INPUTS } },
    d3: { correctiveActions: [], selectedCorrectiveActionIds: [], implementationPlan: '', isNotApplicable: false },
    d4: {
      step: 1,
      hypotheses: [],
      selectedHypotheses: [],
      gembaDiagnostics: [],
      observationChecks: {},
      provenCauses: [],
      finalCause: '',
      fiveWhysHistory: [],
      verificationPlan: '',
      experimentalConfirmedCauses: [],
      primaryCauseId: null,
      secondaryActions: {},
      syntheticCause: null,
      fixedRootCauseIds: [],
      gembaConclusions: '',
    },
    d5_d6: { pokaYokes: [], acpPlans: [], implementationPlan: '', step: 1, implementationSuggestions: {} },
    d7: { a3Report: undefined },
    d8: { poe: '', yokoTen: '', quiz: [] },
    efficacy: { protocols: [], verificationGuides: {} },
  };
}

const randomId = () => Math.random().toString(36).substring(2, 11);

/**
 * Valida la estructura mínima del caso y lo lleva a la versión actual del modelo.
 * Cubre los archivos JSON exportados por versiones anteriores de la herramienta
 * (por ejemplo, el A3 guardado en d5_d6 o el POE guardado en d7).
 */
export function migrateCaseState(input: CaseState): Json {
  const json = input as Json;
  if (!json || typeof json !== 'object' || !json.setup || !json.d2 || !json.d4) {
    throw HttpError.badRequest('Estructura de caso inválida: se requieren setup, d2 y d4');
  }

  const initial = createInitialState();

  return {
    ...initial,
    ...json,
    efficacy: {
      ...initial.efficacy,
      ...(json.efficacy || {}),
    },
    costs: {
      ...initial.costs,
      ...json.costs,
      inputs: { ...DEFAULT_COST_INPUTS, ...(json.costs?.inputs || {}) },
      breakdown: json.costs?.breakdown || [],
    },
    d4: {
      ...initial.d4,
      ...json.d4,
      hypotheses: json.d4?.hypotheses || [],
      selectedHypotheses: json.d4?.selectedHypotheses || [],
      gembaDiagnostics: json.d4?.gembaDiagnostics || [],
      observationChecks: json.d4?.observationChecks || {},
      experimentalConfirmedCauses: json.d4?.experimentalConfirmedCauses || [],
      primaryCauseId: json.d4?.primaryCauseId || null,
      secondaryActions: json.d4?.secondaryActions || {},
      syntheticCause: json.d4?.syntheticCause || null,
      fiveWhysHistory: (json.d4?.fiveWhysHistory || []).map((entry: Json) => ({
        ...entry,
        id: entry.id || `5w-${Date.now()}-${randomId()}`,
      })),
    },
    d5_d6: {
      ...initial.d5_d6,
      ...json.d5_d6,
      acpPlans: json.d5_d6?.acpPlans || [],
      pokaYokes: json.d5_d6?.pokaYokes || [],
    },
    d7: {
      a3Report: json.d7?.a3Report || json.d5_d6?.a3Report,
    },
    d8: {
      poe: json.d8?.poe || json.d7?.poe || '',
      yokoTen: json.d8?.yokoTen || json.d7?.yokoTen || '',
      quiz: json.d8?.quiz || json.d7?.quiz || [],
    },
  };
}

/** Secciones (disciplinas) del caso que cambiaron entre dos versiones. */
export function diffSections(previous: CaseState, next: CaseState): string[] {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return [...keys].filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key])).sort();
}

export function caseNameOf(state: Json): string {
  return typeof state.setup?.caseName === 'string' ? state.setup.caseName : '';
}
