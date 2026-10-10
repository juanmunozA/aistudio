import type { Language } from './templates.js';

export interface FiveW2H {
  what?: string;
  who?: string;
  where?: string;
  when?: string;
  how?: string;
  how_many?: string;
  why_is_it_a_problem?: string;
}

export interface ProblemDefinition {
  phenomenon?: string;
  fiveW2H?: FiveW2H | null;
}

/** Contexto del problema definido en D2 que se agrega a los prompts de cada disciplina. */
export function buildProblemContext(language: Language, problem: ProblemDefinition): string {
  const { phenomenon, fiveW2H } = problem;
  if (!phenomenon && (!fiveW2H || !fiveW2H.what)) return '';

  const es = language === 'es';
  let context = es ? '\n\nCONTEXTO DEL PROBLEMA DEFINIDO (D2):\n' : '\n\nDEFINED PROBLEM CONTEXT (D2):\n';
  context += `${es ? 'FENÓMENO' : 'PHENOMENON'}: ${phenomenon}\n\n`;
  context += `${es ? 'ANÁLISIS 5W2H' : '5W2H ANALYSIS'}:\n`;
  if (fiveW2H) {
    context += `- ${es ? 'QUÉ' : 'WHAT'}: ${fiveW2H.what}\n`;
    context += `- ${es ? 'QUIÉN' : 'WHO'}: ${fiveW2H.who}\n`;
    context += `- ${es ? 'DÓNDE' : 'WHERE'}: ${fiveW2H.where}\n`;
    context += `- ${es ? 'CUÁNDO' : 'WHEN'}: ${fiveW2H.when}\n`;
    context += `- ${es ? 'CÓMO' : 'HOW'}: ${fiveW2H.how}\n`;
    context += `- ${es ? 'CUÁNTO' : 'HOW MANY'}: ${fiveW2H.how_many}\n`;
    context += `- ${es ? 'POR QUÉ' : 'WHY'}: ${fiveW2H.why_is_it_a_problem}\n`;
  }
  return context;
}
