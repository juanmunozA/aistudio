import type { CorrectiveAction } from './types.js';

/** D3: conserva las correcciones que el usuario ya seleccionó y agrega las nuevas de la IA con la fecha de hoy. */
export function buildCorrectiveActions(
  aiActions: Partial<CorrectiveAction>[],
  selectedActions: CorrectiveAction[],
  clientToday: string,
): CorrectiveAction[] {
  const stamp = Date.now();
  const newActions = aiActions.map((action, index) => ({
    action: action.action ?? '',
    responsible: action.responsible ?? '',
    ...action,
    implementationDate: clientToday,
    id: `ca-${stamp}-${index}`,
  }));
  return [...selectedActions, ...newActions];
}
