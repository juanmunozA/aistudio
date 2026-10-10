// Tipos del dominio 8D (mismo modelo que el frontend).
export type ObservationValue = 'yes' | 'no' | null;

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

export interface FiveWhysAnalysis {
  id: string;
  targetCause: string;
  whys: FiveWhyStep[];
  systemicRootCause: string;
}

export interface CorrectiveAction {
  id: string;
  action: string;
  responsible: string;
  implementationDate: string;
}

export interface ActionStep {
  id: string;
  actionId?: string;
  action: string;
  evidenceHow: string;
  evidenceDate: string;
  evidenceResponsible: string;
  verificationHow: string;
  timeframe: string;
  responsible: string;
  isFixed?: boolean;
  type?: string;
}

export interface AcpPlan {
  id: string;
  rootCause: string;
  title: string;
  introduction: string;
  actions: ActionStep[];
  type?: 'primary' | 'secondary';
}

export interface PokaYokeSolution {
  id: string;
  type: string;
  level?: string;
  description: string;
  benefit: string;
  sources?: string;
  details?: string;
  isConfirmed?: boolean;
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

export interface SyntheticCause {
  id: string;
  text: string;
}
