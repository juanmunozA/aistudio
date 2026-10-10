import type { Language } from '../ai/prompts/templates.js';

// Textos por defecto que las reglas de negocio escriben en el caso (mismos del diccionario del frontend).
const texts = {
  es: {
    areaLeader: "Líder de Área",
    additionalPotentialCause: "Causa potencial adicional...",
    implementStandardOrProcedureForThe: "Implementar estándar o procedimiento estandarizado para la oportunidad de mejora",
    trainPersonnelOnTheNewWorking: "Capacitar y sensibilizar al personal involucrado en el nuevo método de trabajo",
    establishOperationalControlsAndChecklistsAt: "Establecer controles operacionales y listas de chequeo en el punto de trabajo",
    auditAndVerifyInGembaThe: "Auditar y verificar en Gemba la efectividad y sostenibilidad de la mejora",
    standardImplementationDocumentOrRecord: "Documento o Registro de implementación del estándar",
    gembaAuditAndKpiFollowUp: "Auditoría en Gemba y seguimiento a KPI",
    improvementPlanTitle: "Plan de Mejora: {{text}}...",
    improvementPlanIntro: "Acciones de mejora para la oportunidad identificada en D1.",
    acpPlanTitle: "Plan ACP: {{text}}...",
    acpPlanIntro: "Acciones para mitigación de falla.",
    failureModeDefault: "Falla Técnica No Determinada",
    implementRandomGembaAuditsToEnsure: "Implementar auditorías aleatorias en Gemba para asegurar adherencia al estándar",
    designAndInstallVisualPokaYoke: "Diseñar e instalar ayudas visuales Poka-Yoke en la estación de trabajo",
    reviewAndUpdateAreaCompetencyAnd: "Revisar y actualizar la matriz de competencias y matriz de riesgos del área",
    establishWeeklyManagementIndicatorToMeasure: "Establecer indicador de gestión semanal para medir el desempeño del proceso",
    t100ComplianceInFieldVerification0: "100% de cumplimiento en verificación de campo (0 reincidencias)",
    t100Compliance0Recurrences: "100% de cumplimiento / 0 reincidencias",
    unknownCause: "Causa Desconocida",
  },
  en: {
    areaLeader: "Area Leader",
    additionalPotentialCause: "Additional potential cause...",
    implementStandardOrProcedureForThe: "Implement standard or procedure for the improvement opportunity",
    trainPersonnelOnTheNewWorking: "Train personnel on the new working method",
    establishOperationalControlsAndChecklistsAt: "Establish operational controls and checklists at the workstation",
    auditAndVerifyInGembaThe: "Audit and verify in Gemba the effectiveness and sustainability of the improvement",
    standardImplementationDocumentOrRecord: "Standard implementation document or record",
    gembaAuditAndKpiFollowUp: "Gemba audit and KPI follow-up",
    improvementPlanTitle: "Improvement Plan: {{text}}...",
    improvementPlanIntro: "Improvement actions for opportunity identified in D1.",
    acpPlanTitle: "PCA Plan: {{text}}...",
    acpPlanIntro: "Actions for failure mitigation.",
    failureModeDefault: "Unified failure mode",
    implementRandomGembaAuditsToEnsure: "Implement random Gemba audits to ensure standard adherence",
    designAndInstallVisualPokaYoke: "Design and install visual Poka-Yoke aids at the workstation",
    reviewAndUpdateAreaCompetencyAnd: "Review and update area competency and risk matrix",
    establishWeeklyManagementIndicatorToMeasure: "Establish weekly management indicator to measure process performance",
    t100ComplianceInFieldVerification0: "100% compliance in field verification (0 recurrences)",
    t100Compliance0Recurrences: "100% compliance / 0 recurrences",
    unknownCause: "Unknown Cause",
  },
} as const;

export type DomainTextKey = keyof (typeof texts)['es'];

/** Texto en el idioma del caso; admite variables con la sintaxis {{nombre}}. */
export function text(language: Language, key: DomainTextKey, values: Record<string, string> = {}): string {
  const template: string = texts[language][key] ?? texts.es[key];
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name] ?? '');
}

/** Categorías 6M del Ishikawa por idioma. */
export const ishikawaCategories: Record<Language, string[]> = {
  es: ['Mano de Obra', 'Maquinaria', 'Materiales', 'Métodos', 'Medición', 'Medio Ambiente'],
  en: ['Manpower', 'Machinery', 'Materials', 'Methods', 'Measurement', 'Environment'],
};
