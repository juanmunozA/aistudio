import { type AppState, type CostInputs } from '../../types';

export const DEFAULT_COST_INPUTS: CostInputs = {
  manoDeObra: "",
  materiaPrima: "",
  materialEmpaque: "",
  recorte: "",
  desperdicio: "",
  productoTerminado: "",
  logisticos: "",
  ensayosPruebas: "",
  otros: "",
  maquinariaEquipos: "",
  infraestructura: "",
  lucroCesante: ""
};

export const INITIAL_STATE: AppState = {
  language: 'es',
  setup: {
    startDate: (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
    caseName: "",
    responsible: "",
    type: "Desviación de proceso",
    impact: ["Calidad"],
    standards: [],
    otherStandard: "",
    otherImpact: ""
  },
  d2: { fieldDataInput: "", images: [], phenomenon: "", analysis: "" },
  costs: { 
    currency: 'COP',
    totalLoss: "", 
    breakdown: [],
    inputs: DEFAULT_COST_INPUTS
  },
  d3: {
    correctiveActions: [],
    selectedCorrectiveActionIds: [],
    implementationPlan: "",
    isNotApplicable: false
  },
  d4: { 
    step: 1,
    hypotheses: [], 
    selectedHypotheses: [], 
    gembaDiagnostics: [], 
    observationChecks: {},
    provenCauses: [], 
    finalCause: "", 
    fiveWhysHistory: [], 
    verificationPlan: "",
    experimentalConfirmedCauses: [],
    primaryCauseId: null,
    secondaryActions: {},
    syntheticCause: null,
    fixedRootCauseIds: [],
    gembaConclusions: ""
  },
  d5_d6: { 
    pokaYokes: [], 
    acpPlans: [], 
    implementationPlan: "",
    step: 1,
    implementationSuggestions: {}
  },
  d7: { a3Report: undefined },
  d8: { poe: "", yokoTen: "", quiz: [] },
  efficacy: { protocols: [], verificationGuides: {} }
};
