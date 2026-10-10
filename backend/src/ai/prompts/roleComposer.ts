import type { Language } from './templates.js';

export interface CaseSetupContext {
  type?: string;
  standards?: string[];
  impact?: string[];
}

/**
 * Ajusta el rol de la IA según el tipo de caso: auditor por norma en hallazgos
 * de auditoría y consultor por impacto en desviaciones y soluciones rápidas.
 */
export function composeSystemPrompt(baseSystem: string, language: Language, setup: CaseSetupContext): string {
  let finalSystem = baseSystem;
  const standards = setup.standards ?? [];
  const impacts = setup.impact ?? [];

  if (setup.type === 'Hallazgo de Auditoría, ACPM' && standards.length > 0) {
    const standardsList = standards.join(', ');
    const auditText =
      language === 'es'
        ? `Adicionalmente a tu rol principal, actúa como un Auditor y Consultor experto certificado en las siguientes normas o regulaciones: ${standardsList}. Tu análisis debe ser coherente con los requisitos, el lenguaje y el marco normativo de cada una de estas entidades o estándares.`
        : `Additionally to your primary role, act as a certified expert Auditor and Consultant for the following standards or regulations: ${standardsList}. Your analysis must be consistent with the requirements, language, and regulatory framework of each of these entities or standards.`;
    finalSystem = `${auditText} ${finalSystem}`;
  }

  if ((setup.type === 'Desviación de proceso' || setup.type === 'Solución Rápida (SR)') && impacts.length > 0) {
    const impactsList = impacts.join(', ');
    const impactText =
      language === 'es'
        ? `Adicionalmente, actúa como un consultor experto senior multidisciplinario especializado en los siguientes impactos: ${impactsList}. Considera profundamente las repercusiones críticas, legales, operativas y financieras que cada uno de estos tipos de impacto conlleva para la organización.`
        : `Additionally, act as a multidisciplinary senior expert consultant specialized in the following impacts: ${impactsList}. Deeply consider the critical, legal, operational, and financial repercussions each of these impacts entails for the organization.`;
    finalSystem = `${impactText} ${finalSystem}`;
  }

  return finalSystem;
}
