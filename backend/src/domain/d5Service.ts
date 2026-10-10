import type { Language } from '../ai/prompts/templates.js';
import { actionText, AUDIT_CASE_TYPE, caseNumberOf, dateInDays, extractActionList, randomSuffix, type DomainContext } from './common.js';
import { fixedRootCauses } from './d4Service.js';
import { text, type DomainTextKey } from './texts.js';
import type { AcpPlan, ActionStep, FiveWhysAnalysis, PokaYokeSolution, SyntheticCause } from './types.js';

const ACTIONS_PER_IMPROVEMENT_PLAN = 4;

const IMPROVEMENT_FALLBACK: DomainTextKey[] = [
  'implementStandardOrProcedureForThe',
  'trainPersonnelOnTheNewWorking',
  'establishOperationalControlsAndChecklistsAt',
  'auditAndVerifyInGembaThe',
];

const REFRESH_FALLBACK: DomainTextKey[] = [
  'implementRandomGembaAuditsToEnsure',
  'designAndInstallVisualPokaYoke',
  'reviewAndUpdateAreaCompetencyAnd',
  'establishWeeklyManagementIndicatorToMeasure',
];

export interface D4Snapshot {
  fixedRootCauseIds: string[];
  fiveWhysHistory: FiveWhysAnalysis[];
  syntheticCause: SyntheticCause | null;
  secondaryActions: Record<string, ActionStep[]>;
  primaryCauseId: string | null;
}

/**
 * D5: un plan ACP por cada causa raíz fijada que tenga acciones. El plan de la causa
 * principal es "primary" y los demás "secondary". En hallazgos de auditoría las acciones
 * se numeran con el número del caso (4235-1, 4235-2, ...).
 */
export function buildAcpPlans(ctx: DomainContext, d4: D4Snapshot, actionMap: Record<string, ActionStep[]>): AcpPlan[] {
  const caseNumber = caseNumberOf(ctx.setup.caseName);
  const isAudit = ctx.setup.type === AUDIT_CASE_TYPE;
  const leader = text(ctx.language, 'areaLeader');
  const roots = fixedRootCauses(d4.fixedRootCauseIds, d4.fiveWhysHistory, d4.syntheticCause);
  let counter = 1;
  const plans: AcpPlan[] = [];

  for (const { id, text: rootText } of roots) {
    const actions = actionMap[id] || [];
    if (actions.length === 0) continue;
    plans.push({
      id: `acp-${id}-${Date.now()}-${randomSuffix()}`,
      rootCause: rootText,
      title: text(ctx.language, 'acpPlanTitle', { text: rootText.substring(0, 40) }),
      introduction: text(ctx.language, 'acpPlanIntro'),
      actions: actions.map((action, index) => ({
        ...action,
        id: action.id || `action-${id}-${index}-${Date.now()}`,
        actionId: isAudit && caseNumber ? `${caseNumber}-${counter++}` : undefined,
        evidenceHow: action.evidenceHow || '',
        evidenceDate: action.evidenceDate || ctx.clientToday,
        evidenceResponsible: action.evidenceResponsible || leader,
        verificationHow: action.verificationHow || '',
        isFixed: action.isFixed || false,
      })),
      type: id === d4.primaryCauseId ? 'primary' : 'secondary',
    });
  }
  return plans;
}

function improvementAction(ctx: DomainContext, actionLabel: string, index: number, idPrefix: string, isFixed: boolean): ActionStep {
  const caseNumber = caseNumberOf(ctx.setup.caseName);
  const defaultDate = dateInDays(30);
  const responsible = ctx.setup.responsible || text(ctx.language, 'areaLeader');
  return {
    id: `${idPrefix}-${index}-${Date.now()}`,
    actionId: caseNumber ? `${caseNumber}-${index + 1}` : `${index + 1}`,
    action: actionLabel,
    evidenceHow: text(ctx.language, 'standardImplementationDocumentOrRecord'),
    evidenceDate: defaultDate,
    evidenceResponsible: responsible,
    verificationHow: text(ctx.language, 'gembaAuditAndKpiFollowUp'),
    responsible,
    timeframe: defaultDate,
    isFixed,
  };
}

const actionsOrFallback = (language: Language, data: unknown, fallback: DomainTextKey[]) => {
  const list = extractActionList(data);
  return list.length > 0 ? list.map(actionText) : fallback.map((key) => text(language, key));
};

/** Oportunidad de mejora (desde D1): plan único con 4 acciones fijadas. */
export function buildImprovementPlan(ctx: DomainContext, data: unknown, phenomenonText: string): AcpPlan {
  const actions = actionsOrFallback(ctx.language, data, IMPROVEMENT_FALLBACK)
    .slice(0, ACTIONS_PER_IMPROVEMENT_PLAN)
    .map((label, index) => improvementAction(ctx, label, index, 'action-improvement', true));
  return {
    id: `acp-improvement-${Date.now()}`,
    rootCause: phenomenonText,
    title: text(ctx.language, 'improvementPlanTitle', { text: phenomenonText.substring(0, 40) }),
    introduction: text(ctx.language, 'improvementPlanIntro'),
    actions,
    type: 'primary',
  };
}

/** Plan a refrescar: el principal, o el primero si no hay principal. */
export function improvementTarget(plans: AcpPlan[]) {
  const primaryIndex = plans.findIndex((plan) => plan.type === 'primary');
  const index = primaryIndex !== -1 ? primaryIndex : 0;
  const plan = plans[index];
  const existing = plan?.actions || [];
  const fixed = existing.filter((action) => action.isFixed);
  return { index, plan, existing, fixedCount: fixed.length, newCount: Math.max(1, ACTIONS_PER_IMPROVEMENT_PLAN - fixed.length) };
}

/** Refresca las acciones no fijadas del plan de mejora, conservando en su lugar las fijadas. */
export function refreshImprovementPlans(ctx: DomainContext, data: unknown, plans: AcpPlan[]): AcpPlan[] {
  const { index, plan, existing, fixedCount, newCount } = improvementTarget(plans);
  if (!plan) return plans;

  const fresh = actionsOrFallback(ctx.language, data, REFRESH_FALLBACK)
    .slice(0, newCount)
    .map((label, i) => {
      const action = improvementAction(ctx, label, fixedCount + i, 'action-improvement-refresh', false);
      return { ...action, id: `action-improvement-refresh-${i}-${Date.now()}` };
    });

  const finalActions: ActionStep[] = [];
  let next = 0;
  for (const action of existing) {
    if (action.isFixed) finalActions.push(action);
    else if (next < fresh.length) finalActions.push(fresh[next++]!);
  }
  while (next < fresh.length) finalActions.push(fresh[next++]!);

  const updated = [...plans];
  updated[index] = { ...plan, actions: finalActions };
  return updated;
}

/** D6: conserva los Poka-Yoke confirmados y agrega las nuevas propuestas sin confirmar. */
export function mergePokaYokes(current: PokaYokeSolution[], incoming: Partial<PokaYokeSolution>[]): PokaYokeSolution[] {
  const confirmed = current.filter((poka) => poka.isConfirmed);
  const proposals = incoming.map((solution) => ({
    type: '',
    description: '',
    benefit: '',
    ...solution,
    id: `poka-${Date.now()}-${Math.random()}`,
    isConfirmed: false,
  }));
  return [...confirmed, ...proposals];
}
