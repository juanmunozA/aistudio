import type { AppState } from '../../types';
import { apiRequest } from './httpClient';

export type AiOperation =
  | 'd2'
  | 'costs'
  | 'd3'
  | 'd3Implementation'
  | 'd4Ishikawa'
  | 'd4Gemba'
  | 'd4Verify'
  | 'd4Whys'
  | 'd4CombinedCause'
  | 'd4Secondary'
  | 'd5AcpPlans'
  | 'd5Improvement'
  | 'd5RefreshImprovement'
  | 'd5Implementation'
  | 'd5Poka'
  | 'pokaDetail'
  | 'd5A3'
  | 'd7Poe'
  | 'd7YokoTen'
  | 'd7Quiz'
  | 'efficacyValidation'
  | 'verificationGuide';

/** Fecha local del usuario (YYYY-MM-DD). */
export const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/** D5 sin IA: el backend arma los planes ACP con las acciones ya generadas en D4. */
export function buildAcpPlans(state: AppState) {
  return apiRequest<{ data: { acpPlans: AppState['d5_d6']['acpPlans'] } }>('/domain/acp-plans', {
    method: 'POST',
    body: {
      language: state.language,
      clientToday: localToday(),
      setup: { type: state.setup.type, caseName: state.setup.caseName, responsible: state.setup.responsible },
      d4: state.d4,
    },
  }).then((result) => result.data.acpPlans);
}

/**
 * Ejecuta una operación de IA en el backend. El navegador solo envía los datos del
 * caso; el prompt, el rol y el formato de respuesta se arman en el servidor.
 */
export function runAiOperation<T = unknown>(operation: AiOperation, state: AppState, input: unknown): Promise<T> {
  return apiRequest<{ data: T }>(`/ai/${operation}`, {
    method: 'POST',
    body: {
      language: state.language,
      clientToday: localToday(),
      setup: {
        type: state.setup.type,
        standards: state.setup.standards,
        impact: state.setup.impact,
        caseName: state.setup.caseName,
        responsible: state.setup.responsible,
      },
      problem: { phenomenon: state.d2.phenomenon, fiveW2H: state.d2.fiveW2H ?? null },
      input,
    },
  }).then((result) => result.data);
}
