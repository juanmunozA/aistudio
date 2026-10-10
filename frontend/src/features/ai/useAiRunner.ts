import { useCallback } from 'react';
import { translatorFor } from '../../i18n';
import { runAiOperation, type AiOperation } from '../../services/api/aiApi';
import { caseActions, useCaseStore } from '../../store/caseStore';

/**
 * Controlador de las operaciones de IA: envía los datos del caso al backend y entrega
 * el resultado ya procesado. `loading` indica qué acción está en curso.
 */
export function useAiRunner() {
  const loading = useCaseStore((store) => store.loadingKey);
  const setLoadingKey = useCaseStore((store) => store.setLoadingKey);

  const runAi = useCallback(
    async <T = unknown>(key: string, operation: AiOperation, input: unknown, onResult?: (data: T) => void) => {
      const current = caseActions.getCase();
      setLoadingKey(key);
      try {
        const data = await runAiOperation<T>(operation, current, input);
        onResult?.(data);
      } catch (error) {
        console.error('AI Error:', error);
        const t = translatorFor(current.language);
        alert(`${t('waitingAnalysis')} Error: ${error instanceof Error ? error.message : 'Error'}`);
      } finally {
        setLoadingKey(null);
      }
    },
    [setLoadingKey],
  );

  return { runAi, loading };
}
