import type { AppState } from '../../../types';
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

/**
 * Ejecuta una operación de IA en el backend. El navegador solo envía los datos del
 * caso; el prompt, el rol y el formato de respuesta se arman en el servidor.
 */
export function runAiOperation<T = unknown>(operation: AiOperation, state: AppState, input: unknown): Promise<T> {
  return apiRequest<{ data: T }>(`/ai/${operation}`, {
    method: 'POST',
    body: {
      language: state.language,
      setup: { type: state.setup.type, standards: state.setup.standards, impact: state.setup.impact },
      problem: { phenomenon: state.d2.phenomenon, fiveW2H: state.d2.fiveW2H ?? null },
      input,
    },
  }).then((result) => result.data);
}
