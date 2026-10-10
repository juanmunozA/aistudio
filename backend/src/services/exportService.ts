import * as XLSX from '@e965/xlsx';
import type { Language } from '../ai/prompts/templates.js';
import { text } from '../domain/texts.js';
import type { AcpPlan, CorrectiveAction, EfficacyProtocol, FiveWhysAnalysis, GembaDiagnostic, Hypothesis, ObservationValue, PokaYokeSolution } from '../domain/types.js';
import type { CaseState } from '../models/case.js';
import { HttpError } from '../utils/httpError.js';
import { migrateCaseState } from './caseStateMigration.js';

type Row = (string | number | undefined | null)[];

interface CaseData {
  language: Language;
  setup: { startDate?: string; caseName?: string; responsible?: string; type?: string; impact?: string[]; standards?: string[] };
  d2: { phenomenon?: string; fiveW2H?: Record<string, unknown> };
  costs: { totalLoss?: string; currency?: string; breakdown?: { category: string; estimated_value: string; impact_description: string }[] };
  d3: { isNotApplicable?: boolean; correctiveActions: CorrectiveAction[]; selectedCorrectiveActionIds: string[]; implementationPlan?: string };
  d4: {
    hypotheses: Hypothesis[];
    selectedHypotheses: string[];
    verificationPlan?: string;
    experimentalConfirmedCauses: string[];
    gembaDiagnostics: GembaDiagnostic[];
    observationChecks: Record<string, ObservationValue[]>;
    syntheticCause?: { text: string } | null;
    finalCause?: string;
    fiveWhysHistory: FiveWhysAnalysis[];
  };
  d5_d6: { acpPlans: AcpPlan[]; pokaYokes: PokaYokeSolution[] };
  efficacy: { protocols: EfficacyProtocol[] };
  d7: { a3Report?: { financialJustification?: string; risks?: string } };
  d8: { poe?: string; yokoTen?: string };
}

export type ExportType = 'full-report' | 'gemba-checklist' | 'acp-plan';

interface ExportDefinition {
  sheet: string;
  fileName: (caseName: string) => string;
  columns: number[];
  rows: (data: CaseData, generatedAt: string) => Row[];
}

function fullReportRows(data: CaseData, generatedAt: string): Row[] {
  const t = (key: Parameters<typeof text>[1]) => text(data.language, key);
  const { setup, d2, costs, d3, d4, d5_d6, efficacy, d7, d8 } = data;
  const rows: Row[] = [['REPORTE ESTRUCTURADO 8D - ANÁLISIS DE CAUSA RAÍZ'], ['Generado el:', generatedAt], [], ['DISCIPLINA', 'SECCIÓN', 'CAMPO', 'VALOR']];

  rows.push(['D0: CONFIGURACIÓN', 'INFORMACIÓN GENERAL', t('startDate'), setup.startDate]);
  rows.push(['D0: CONFIGURACIÓN', 'INFORMACIÓN GENERAL', t('caseName'), setup.caseName]);
  rows.push(['D0: CONFIGURACIÓN', 'INFORMACIÓN GENERAL', t('responsible'), setup.responsible]);
  rows.push(['D0: CONFIGURACIÓN', 'INFORMACIÓN GENERAL', t('caseType'), setup.type]);
  rows.push(['D0: CONFIGURACIÓN', 'REQUISITOS', `${t('impacts')}/${t('standards')}`, (setup.impact || setup.standards || []).join(' | ')]);

  rows.push(['D1/D2: DEFINICIÓN', 'FENOMENOLOGÍA', t('phenomenology'), d2.phenomenon]);
  Object.entries(d2.fiveW2H || {}).forEach(([key, value]) => rows.push(['D1/D2: DEFINICIÓN', '5W2H', key.toUpperCase(), String(value)]));

  rows.push(['D1/D2: DEFINICIÓN', 'IMPACTO FINANCIERO', 'PÉRDIDA TOTAL', `${costs.totalLoss} ${costs.currency}`]);
  (costs.breakdown || []).forEach((b) => rows.push(['D1/D2: DEFINICIÓN', 'DETALLE COSTOS', b.category, `${b.estimated_value} | ${b.impact_description}`]));

  if (d3.isNotApplicable) {
    rows.push(['D3: CORRECCIÓN', 'NO APLICA', 'DETALLE', 'No aplica para este caso']);
  } else {
    const selected = d3.correctiveActions.filter((a) => d3.selectedCorrectiveActionIds.includes(a.id));
    if (selected.length > 0) {
      selected.forEach((action, idx) => {
        rows.push([`D3: CORRECCIÓN (${idx + 1})`, 'ACCIÓN SELECCIONADA', 'DESCRIPCIÓN', action.action]);
        rows.push([`D3: CORRECCIÓN (${idx + 1})`, 'ACCIÓN SELECCIONADA', 'RESPONSABLE', action.responsible]);
        rows.push([`D3: CORRECCIÓN (${idx + 1})`, 'ACCIÓN SELECCIONADA', 'FECHA', action.implementationDate]);
      });
    } else {
      rows.push(['D3: CORRECCIÓN', 'ACCIÓN SELECCIONADA', 'DESCRIPCIÓN', '']);
      rows.push(['D3: CORRECCIÓN', 'ACCIÓN SELECCIONADA', 'RESPONSABLE', '']);
      rows.push(['D3: CORRECCIÓN', 'ACCIÓN SELECCIONADA', 'FECHA', '']);
    }
    rows.push(['D3: CORRECCIÓN', 'PLAN DE IMPLEMENTACIÓN', 'DETALLE', d3.implementationPlan]);
  }

  const ishikawa = d4.hypotheses.filter((h) => d4.selectedHypotheses.includes(h.id)).map((h) => `[${h.category}] ${h.text}`);
  rows.push(['D4: CAUSA RAÍZ', 'ISHIKAWA', t('ishikawaSummary'), ishikawa.join(' | ')]);
  rows.push(['D4: CAUSA RAÍZ', 'PLAN EXPERIMENTAL', t('expSummary'), d4.verificationPlan]);
  const confirmed = d4.experimentalConfirmedCauses.map((id) => d4.gembaDiagnostics.find((d) => d.hypothesisId === id)?.cause || id);
  rows.push(['D4: CAUSA RAÍZ', 'CAUSAS CONFIRMADAS', 'LISTADO', confirmed.join(' | ')]);
  rows.push(['D4: CAUSA RAÍZ', 'MODO DE FALLA', t('unifiedFailure'), d4.syntheticCause?.text || d4.finalCause]);
  d4.fiveWhysHistory.forEach((h, idx) => rows.push(['D4: CAUSA RAÍZ', '5 PORQUÉS', `ANÁLISIS ${idx + 1}`, h.systemicRootCause]));

  d5_d6.acpPlans.forEach((plan) =>
    plan.actions
      .filter((a) => a.isFixed)
      .forEach((a) => rows.push(['D5: GESTIÓN ACP', 'ACCIONES FIJADAS', plan.title, `${a.action} | RESP: ${a.responsible} | PLAZO: ${a.timeframe}`])),
  );
  d5_d6.pokaYokes.forEach((py) => rows.push(['D6: POKA-YOKE', 'DISPOSITIVO', py.type, `${py.description} | BENEFICIO: ${py.benefit}`]));
  efficacy.protocols.forEach((p, idx) =>
    rows.push(['VALIDACIÓN EFICACIA', `PROTOCOLO ${idx + 1}`, p.action, `${p.verificationMethod} | KPI: ${p.kpi} | FREQ: ${p.auditFrequency}`]),
  );
  if (d7.a3Report) {
    rows.push(['D7: ESTÁNDARES', 'RESUMEN A3', 'JUSTIFICACIÓN FINANCIERA', d7.a3Report.financialJustification]);
    rows.push(['D7: ESTÁNDARES', 'RESUMEN A3', 'EVALUACIÓN DE RIESGOS', d7.a3Report.risks]);
  }
  rows.push(['D8: REPORTE A3', 'POE', 'RESUMEN', d8.poe]);
  rows.push(['D8: REPORTE A3', 'YOKOTEN', 'DESPLIEGUE', d8.yokoTen]);
  return rows;
}

function gembaRows(data: CaseData): Row[] {
  const { d4, setup } = data;
  if (d4.gembaDiagnostics.length === 0) throw HttpError.badRequest('No hay checklist Gemba generado');
  const rows: Row[] = [['CHECKLIST GEMBA - VALIDACIÓN EN PISO'], ['Caso:', setup.caseName], [], ['HIPOTESIS', 'CATEGORIA', 'PREGUNTA', 'RESPUESTA AUDITADA']];
  d4.gembaDiagnostics.forEach((diagnostic) => {
    const hypothesis = d4.hypotheses.find((h) => h.id === diagnostic.hypothesisId);
    const checks = d4.observationChecks[diagnostic.hypothesisId] || [];
    diagnostic.questions.forEach((question, idx) => {
      const answer = checks[idx] === 'yes' ? 'SI' : checks[idx] === 'no' ? 'NO' : 'PENDIENTE';
      rows.push([diagnostic.cause, hypothesis?.category || 'N/A', question, answer]);
    });
  });
  return rows;
}

function acpRows(data: CaseData): Row[] {
  const { d5_d6, setup } = data;
  if (d5_d6.acpPlans.length === 0) throw HttpError.badRequest('No hay planes ACP generados');
  const rows: Row[] = [
    ['PLAN DE ACCIONES CORRECTIVAS PERMANENTES (ACP)'],
    ['Caso:', setup.caseName],
    [],
    ['TIPO', 'TITULO', 'CAUSA_RAIZ', 'ID_ACCION', 'ACCION', 'EVIDENCIA_IMPLEMENTACION', 'VERIFICACION_IMPLEMENTACION', 'FECHA', 'RESPONSABLE', 'ESTADO'],
  ];
  d5_d6.acpPlans.forEach((plan) =>
    plan.actions.forEach((action) =>
      rows.push([
        plan.type,
        plan.title,
        plan.rootCause,
        action.actionId || '',
        action.action,
        action.evidenceHow || '',
        action.verificationHow || '',
        action.timeframe,
        action.responsible,
        action.isFixed ? 'FIXED' : 'PENDING',
      ]),
    ),
  );
  return rows;
}

const definitions: Record<ExportType, ExportDefinition> = {
  'full-report': { sheet: 'Reporte 8D', fileName: (name) => `Reporte_Full_8D_${name}.xlsx`, columns: [25, 30, 35, 80], rows: fullReportRows },
  'gemba-checklist': { sheet: 'Gemba Checklist', fileName: (name) => `Checklist_GEMBA_${name}.xlsx`, columns: [40, 20, 60, 20], rows: gembaRows },
  'acp-plan': { sheet: 'Plan ACP', fileName: (name) => `Plan_ACP_${name}.xlsx`, columns: [15, 25, 30, 15, 40, 40, 40, 15, 20, 15], rows: acpRows },
};

export const EXPORT_TYPES = Object.keys(definitions) as ExportType[];

/** Genera el Excel de un reporte del caso (mismo contenido y formato que antes generaba el navegador). */
export function buildExport(type: ExportType, state: CaseState, generatedAt: string): { fileName: string; content: Buffer } {
  const definition = definitions[type];
  const data = migrateCaseState(state) as unknown as CaseData;
  const sheet = XLSX.utils.aoa_to_sheet(definition.rows(data, generatedAt));
  sheet['!cols'] = definition.columns.map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, definition.sheet);
  const content = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  return { fileName: definition.fileName(data.setup.caseName || 'Proyecto'), content };
}
