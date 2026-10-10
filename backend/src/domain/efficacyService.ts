import { utcToday, type DomainContext } from './common.js';
import { text } from './texts.js';
import type { ActionStep, EfficacyProtocol } from './types.js';

const stackIds = (ids: string) =>
  ids
    ? ids
        .split(/,\s*|\n+/)
        .map((id) => id.trim())
        .filter(Boolean)
        .join('\n')
    : '';

/**
 * Protocolo único de validación de eficacia para todas las acciones fijadas en D5.
 * Completa los campos que la IA no devuelva y asegura que el KPI tenga una meta numérica.
 */
export function buildEfficacyProtocol(ctx: DomainContext, data: unknown, fixedActions: ActionStep[]): EfficacyProtocol {
  const response = data as { protocols?: Partial<EfficacyProtocol>[] } & Partial<EfficacyProtocol>;
  const protocols = Array.isArray(response?.protocols) && response.protocols.length > 0 ? response.protocols : [response];
  const protocol = protocols[0] || {};
  const today = utcToday();

  const allIds = fixedActions
    .map((action) => action.actionId || 'N/A')
    .filter(Boolean)
    .join('\n');
  const shortDescription = fixedActions
    .map((action) => {
      const words = (action.action || '').trim().split(/\s+/).slice(0, 4).join(' ');
      return `${action.actionId ? `${action.actionId}: ` : ''}${words}`;
    })
    .join('; ');

  let kpi = (protocol.kpi || '').trim();
  if (!kpi) kpi = text(ctx.language, 't100ComplianceInFieldVerification0');
  else if (!/\d/.test(kpi)) kpi = `${kpi} (Meta: ${text(ctx.language, 't100Compliance0Recurrences')})`;

  return {
    id: stackIds(protocol.id && protocol.id.length >= 3 ? protocol.id : allIds),
    action: protocol.action || shortDescription,
    verificationMethod: protocol.verificationMethod || '',
    kpi,
    auditFrequency: protocol.auditFrequency || '',
    contingencyPlan: protocol.contingencyPlan || '',
    executionResponsible: protocol.executionResponsible || fixedActions[0]?.responsible || ctx.setup.responsible || '',
    executionDate: protocol.executionDate || today,
    verificationResponsible: protocol.verificationResponsible || ctx.setup.responsible || '',
    verificationDate: protocol.verificationDate || today,
    isEffective: protocol.isEffective || 'SI',
  };
}
