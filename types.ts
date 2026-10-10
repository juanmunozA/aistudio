export type Language = 'es' | 'en';

export interface Hypothesis {
  id: string;
  category: string;
  text: string;
}

export interface GembaDiagnostic {
  hypothesisId: string;
  cause: string;
  questions: string[];
}

export interface FiveWhyStep {
  step: string;
  answer: string;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  responsible: string;
  implementationDate: string;
}

export interface PokaYokeSolution {
  id: string;
  type: string;
  level?: 'Básico' | 'Avanzado' | 'Basic' | 'Advanced';
  description: string;
  benefit: string;
  sources?: string;
  details?: string;
  isConfirmed?: boolean;
}

export interface CostBreakdown {
  category: string;
  impact_description: string;
  estimated_value: string;
}

export interface CostInputs {
  manoDeObra: string;
  materiaPrima: string;
  materialEmpaque: string;
  recorte: string;
  desperdicio: string;
  productoTerminado: string;
  logisticos: string;
  ensayosPruebas: string;
  otros: string;
  maquinariaEquipos: string;
  infraestructura: string;
  lucroCesante: string;
}

export interface FiveW2H {
  what: string;
  who: string;
  where: string;
  when: string;
  how: string;
  how_many: string;
  why_is_it_a_problem: string;
  affected_clauses: string;
}

export interface AnalysisSetup {
  startDate: string;
  caseName: string;
  responsible: string;
  type: 'Desviación de proceso' | 'Hallazgo de Auditoría, ACPM' | 'Hallazgo de auditoría (No conformidades)' | 'Quejas de Inocuidad' | 'Oportunidad de mejora' | 'Solución Rápida (SR)' | string;
  impact?: string[];
  standards: string[];
  otherStandard?: string;
  otherImpact?: string;
}

export interface FiveWhysAnalysis {
  id: string;
  targetCause: string;
  whys: FiveWhyStep[];
  systemicRootCause: string;
}

// Added 'type' property to support actions returned by AI in D7 A3 Report which often includes a type classification
export interface ActionStep {
  id: string;
  actionId?: string;
  action: string;
  evidenceHow: string;
  evidenceDate: string;
  evidenceResponsible: string;
  verificationHow: string;
  timeframe: string; // Implementation date
  responsible: string; // Implementation responsible
  isFixed?: boolean;
  type?: string;
}

export interface ACPPlan {
  id: string;
  rootCause: string;
  title: string;
  introduction: string;
  actions: ActionStep[];
  type?: 'primary' | 'secondary';
}

export interface EfficacyProtocol {
  id: string;
  action: string;
  verificationMethod: string;
  kpi: string;
  auditFrequency: string;
  contingencyPlan: string;
  executionResponsible: string;
  executionDate: string;
  verificationResponsible: string;
  verificationDate: string;
  isEffective: string;
}

export interface AppState {
  language: Language;
  setup: AnalysisSetup;
  d2: {
    fieldDataInput: string;
    images?: string[];
    phenomenon: string;
    analysis: string;
    fiveW2H?: FiveW2H;
  };
  costs: {
    currency: 'COP' | 'CRC' | 'USD';
    totalLoss: string;
    breakdown: CostBreakdown[];
    inputs: CostInputs;
  };
  d3: {
    correctiveActions: CorrectiveAction[];
    selectedCorrectiveActionIds: string[];
    implementationPlan: string;
    isNotApplicable?: boolean;
  };
  d4: {
    step: number;
    hypotheses: Hypothesis[];
    selectedHypotheses: string[]; // Stores Hypothesis IDs
    gembaDiagnostics: GembaDiagnostic[];
    observationChecks: Record<string, ObservationValue[]>; // Keyed by Hypothesis ID
    provenCauses: string[];
    finalCause: string;
    fiveWhysHistory: FiveWhysAnalysis[];
    verificationPlan: string;
    experimentalConfirmedCauses: string[]; // Stores Hypothesis IDs
    primaryCauseId: string | null;
    secondaryActions: Record<string, ActionStep[]>; // Keyed by Hypothesis ID
    syntheticCause: { id: string; text: string } | null;
    fixedRootCauseIds: string[];
    gembaConclusions?: string;
  };
  d5_d6: {
    pokaYokes: PokaYokeSolution[];
    acpPlans: ACPPlan[];
    implementationPlan: string;
    step: number;
    implementationSuggestions: Record<string, string>;
  };
  d7: {
    a3Report?: A3ReportData;
  };
  d8: {
    poe: string;
    yokoTen: string;
    quiz: { question_text: string; options: string[]; correct_answer: number }[];
  };
  efficacy: {
    protocols: EfficacyProtocol[];
    verificationGuides: Record<string, string>; // Keyed by protocol ID
  };
}

export interface EfficacyStep {
  actionId: string;
  action: string;
  method: string;
  responsible: string;
  date: string;
  isEffective: string;
}

export interface A3ReportData {
  generationDate: string;
  responsible: string;
  phenomenon: string;
  rootCauses: string;
  risks: string;
  actions: ActionStep[];
  standardization: string;
  financialJustification: string;
  efficacySteps: EfficacyStep[];
}

export type ObservationValue = 'yes' | 'no' | null;

export enum Tab {
  SETUP = 'setup',
  D1_D2 = 'd1-d2',
  D3 = 'd3',
  D4 = 'd4',
  D5 = 'd5',
  D6 = 'd6',
  D7 = 'd7',
  D8 = 'd8',
  EFFICACY = 'efficacy'
}