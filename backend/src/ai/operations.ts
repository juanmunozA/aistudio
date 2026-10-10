import { z } from 'zod';
import type { DomainContext } from '../domain/common.js';
import { buildCorrectiveActions } from '../domain/d3Service.js';
import {
  buildFiveWhys,
  buildGemba,
  buildSecondaryActions,
  buildSyntheticCause,
  confirmedByGemba,
  fixedRootCauses,
  mergeIshikawa,
  selectedHypotheses,
} from '../domain/d4Service.js';
import { buildAcpPlans, buildImprovementPlan, improvementTarget, mergePokaYokes, refreshImprovementPlans } from '../domain/d5Service.js';
import { buildEfficacyProtocol } from '../domain/efficacyService.js';
import { text as domainText } from '../domain/texts.js';
import type { AcpPlan, ActionStep, CorrectiveAction, FiveWhysAnalysis, GembaDiagnostic, Hypothesis, ObservationValue, PokaYokeSolution } from '../domain/types.js';
import type { ResponseSchemaKey } from './prompts/responseSchemas.js';
import type { TemplateKey } from './prompts/templates.js';

export interface ImagePart {
  mimeType: string;
  data: string;
}

export interface UserContent {
  text: string;
  images?: ImagePart[];
}

export interface BuildContext extends DomainContext {
  /** Contexto del problema definido en D2 (vacío si aún no existe). */
  problemContext: string;
}

export interface OperationDefinition<TInput> {
  template: TemplateKey;
  temperature: number;
  responseSchema: ResponseSchemaKey | null;
  input: z.ZodType<TInput>;
  buildUserContent: (input: TInput, ctx: BuildContext) => UserContent;
  /** Regla de negocio de la disciplina: convierte la respuesta de la IA en los datos que se guardan en el caso. */
  // La respuesta ya fue validada contra su schema; cada regla lee solo los campos que necesita.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toResult?: (raw: any, input: TInput, ctx: BuildContext) => unknown;
}

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const optionalText = z.string().nullish();

const acpAction = z.object({
  actionId: optionalText,
  action: optionalText,
  responsible: optionalText,
  timeframe: optionalText,
  isFixed: z.boolean().optional(),
});

const acpPlan = z.object({
  type: optionalText,
  rootCause: optionalText,
  actions: z.array(acpAction).default([]),
});

// Fragmentos del caso que algunas reglas necesitan; se validan de forma laxa porque los define el propio modelo del caso.
const looseArray = <T,>() => z.array(z.unknown()).default([]).transform((items) => items as T[]);
const looseRecord = <T,>() => z.record(z.string(), z.unknown()).default({}).transform((value) => value as Record<string, T>);

const d4Snapshot = z.object({
  fixedRootCauseIds: z.array(z.string()).default([]),
  fiveWhysHistory: looseArray<FiveWhysAnalysis>(),
  syntheticCause: z.object({ id: z.string(), text: z.string() }).nullish().transform((value) => value ?? null),
  secondaryActions: looseRecord<ActionStep[]>(),
  primaryCauseId: z.string().nullish().transform((value) => value ?? null),
});

const fixedActionsOf = (plans: z.infer<typeof acpPlan>[]) => plans.flatMap((plan) => plan.actions || []).filter((a) => a.isFixed);

const causesPayload = (causes: { id: string; text?: string | null }[]) =>
  causes.map((item) => `hypothesisId: ${item.id} | cause: ${item.text}`).join('\n');

const dataUrlToImage = (dataUrl: string): ImagePart => {
  const [mimeInfo = '', base64Data = ''] = dataUrl.split(',');
  const mimeType = mimeInfo.match(/:(.*?);/)?.[1] || 'image/png';
  return { mimeType, data: base64Data };
};

const define = <TInput>(definition: OperationDefinition<TInput>) => definition;

/**
 * Operaciones de IA del kit. Cada una arma en el servidor el prompt de usuario a
 * partir de los datos del caso, con el mismo texto que antes armaba el navegador.
 */
export const aiOperations = {
  d2: define({
    template: 'd2',
    temperature: 0.2,
    responseSchema: 'd2',
    input: z.object({ fieldDataInput: text, images: z.array(z.string()).default([]) }),
    buildUserContent: ({ fieldDataInput, images }) => ({
      text:
        fieldDataInput ||
        (images.length > 0 ? 'Analyze the provided images to extract the problem description.' : 'Analyze the provided information.'),
      images: images.map(dataUrlToImage),
    }),
    toResult: (raw) => ({ phenomenon: raw?.phenomenon_description || '', analysis: '', fiveW2H: raw?.fiveW2H }),
  }),

  costs: define({
    template: 'costs',
    temperature: 0.3,
    responseSchema: 'costs',
    input: z.object({ inputs: z.record(z.string(), z.unknown()).default({}), phenomenon: text, currency: text }),
    buildUserContent: ({ inputs, phenomenon, currency }) => {
      const costSummary = Object.entries(inputs)
        .filter(([, value]) => String(value || '').trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      return {
        text: `Datos de costos tangibles del usuario: ${costSummary || 'Sin costos tangibles reportados'}. Fenómeno: ${phenomenon}. Moneda seleccionada: ${currency}.`,
      };
    },
    toResult: (raw) => ({ totalLoss: raw?.total_loss_estimate || '', breakdown: raw?.cost_breakdown || [] }),
  }),

  d3: define({
    template: 'd3',
    temperature: 0.3,
    responseSchema: 'd3',
    input: z.object({ caseName: text, phenomenon: text, selectedActions: looseArray<CorrectiveAction>() }),
    buildUserContent: ({ caseName, phenomenon }, { problemContext }) => ({
      text: `Case: ${caseName}. Phenomenon: ${phenomenon}.${problemContext}`,
    }),
    toResult: (raw, { selectedActions }, ctx) => ({
      correctiveActions: buildCorrectiveActions(raw?.actions || [], selectedActions, ctx.clientToday),
      implementationPlan: '',
    }),
  }),

  d3Implementation: define({
    template: 'd3Implementation',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({
      actions: z.array(z.object({ action: optionalText, responsible: optionalText, implementationDate: optionalText })).min(1),
    }),
    buildUserContent: ({ actions }, { language, problemContext }) => {
      const label = language === 'es' ? 'Corrección' : 'Correction';
      const actionsText = actions
        .map((a) => `${label}: ${a.action}. Responsable: ${a.responsible}. Fecha: ${a.implementationDate}.`)
        .join('\n');
      return { text: `${actionsText}${problemContext}` };
    },
    toResult: (raw) => ({ implementationPlan: raw || '' }),
  }),

  d4Ishikawa: define({
    template: 'd4Ishikawa',
    temperature: 0.4,
    responseSchema: 'd4Ishikawa',
    input: z.object({
      phenomenon: text,
      hypotheses: looseArray<Hypothesis>(),
      selectedHypotheses: z.array(z.string()).default([]),
    }),
    buildUserContent: ({ phenomenon, hypotheses, selectedHypotheses: selectedIds }, { problemContext }) => {
      const existing = selectedHypotheses(hypotheses, selectedIds)
        .map((c) => `[${c.category}]: ${c.text}`)
        .join('; ');
      const suffix = existing ? `\n\nEXISTING CAUSES (DO NOT REPEAT THESE, GENERATE NEW AND DIFFERENT ONES): ${existing}` : '';
      return { text: `Phenomenon: ${phenomenon}${problemContext}${suffix}` };
    },
    toResult: (raw, { hypotheses, selectedHypotheses: selectedIds }, ctx) => ({
      hypotheses: mergeIshikawa(ctx.language, raw?.hypotheses || [], hypotheses, selectedIds),
      step: 1,
    }),
  }),

  d4Gemba: define({
    template: 'd4Gemba',
    temperature: 0.3,
    responseSchema: 'd4Gemba',
    input: z
      .object({
        hypotheses: looseArray<Hypothesis>(),
        selectedHypotheses: z.array(z.string()).default([]),
        observationChecks: looseRecord<ObservationValue[]>(),
      })
      .refine((value) => selectedHypotheses(value.hypotheses, value.selectedHypotheses).length > 0, {
        message: 'Debe fijar al menos una hipótesis',
      }),
    buildUserContent: ({ hypotheses, selectedHypotheses: selectedIds }, { problemContext }) => {
      const causesText = selectedHypotheses(hypotheses, selectedIds)
        .map((h) => `ID: ${h.id} - Cause: ${h.text}`)
        .join(', ');
      return { text: `Causes to audit: ${causesText}.${problemContext}` };
    },
    toResult: (raw, { observationChecks }) => ({ ...buildGemba(raw?.diagnostics || [], observationChecks), step: 2 }),
  }),

  d4Verify: define({
    template: 'd4Verify',
    temperature: 0.4,
    responseSchema: null,
    input: z
      .object({
        phenomenon: text,
        gembaDiagnostics: looseArray<GembaDiagnostic>(),
        observationChecks: looseRecord<ObservationValue[]>(),
      })
      .refine((value) => confirmedByGemba(value.gembaDiagnostics, value.observationChecks).length > 0, {
        message: 'No hay causas confirmadas en el Gemba',
      }),
    buildUserContent: ({ phenomenon, gembaDiagnostics, observationChecks }, { problemContext }) => {
      const causesText = confirmedByGemba(gembaDiagnostics, observationChecks)
        .map((diagnostic) => `- Cause: ${diagnostic.cause}`)
        .join('\n');
      return { text: `PHENOMENON: ${phenomenon}\n\nLIST OF CAUSES:\n${causesText}${problemContext}` };
    },
    toResult: (raw) => ({ verificationPlan: raw || '' }),
  }),

  d4Whys: define({
    template: 'd4Whys',
    temperature: 0.4,
    responseSchema: 'd4Whys',
    input: z.object({ targetCause: text, gembaConclusions: text }),
    buildUserContent: ({ targetCause, gembaConclusions }, { problemContext }) => {
      const conclusions = gembaConclusions
        ? `\n\nCONCLUSIONES DEL GEMBA RECOPILADAS (INFORMACIÓN ADICIONAL PARA ENFOCAR EL ANÁLISIS):\n${gembaConclusions}`
        : '';
      return { text: `Confirmed: ${targetCause}.${problemContext}${conclusions}` };
    },
    toResult: (raw, { targetCause }) => ({ analysis: buildFiveWhys(targetCause, raw), finalCause: targetCause, step: 4 }),
  }),

  d4CombinedCause: define({
    template: 'd4CombinedCause',
    temperature: 0.5,
    responseSchema: 'd4CombinedCause',
    input: z.object({
      phenomenon: text,
      fixedRootCauseIds: z.array(z.string()).min(1),
      fiveWhysHistory: looseArray<FiveWhysAnalysis>(),
    }),
    buildUserContent: ({ phenomenon, fixedRootCauseIds, fiveWhysHistory }, { problemContext, language }) => {
      const rootCauses = fixedRootCauseIds.map(
        (id) => fiveWhysHistory.find((analysis) => analysis.id === id)?.systemicRootCause || domainText(language, 'unknownCause'),
      );
      return { text: `PHENOMENON: ${phenomenon}\nROOT CAUSES: ${rootCauses.join('; ')}${problemContext}` };
    },
    toResult: (raw, _input, ctx) => ({ syntheticCause: buildSyntheticCause(ctx.language, raw) }),
  }),

  d4Secondary: define({
    template: 'd4Secondary',
    temperature: 0.4,
    responseSchema: 'd4Secondary',
    input: z.object({ phenomenon: text, d4: d4Snapshot.refine((d4) => d4.fixedRootCauseIds.length > 0) }),
    buildUserContent: ({ phenomenon, d4 }, { problemContext }) => ({
      text: `PHENOMENON: ${phenomenon}\n\nCAUSES LIST:\n${causesPayload(fixedRootCauses(d4.fixedRootCauseIds, d4.fiveWhysHistory, d4.syntheticCause))}${problemContext}`,
    }),
    toResult: (raw, { d4 }, ctx) => ({
      secondaryActions: buildSecondaryActions(ctx.language, raw, d4.fixedRootCauseIds, d4.secondaryActions),
    }),
  }),

  /** D5: genera las acciones que faltan por causa raíz y arma los planes ACP. */
  d5AcpPlans: define({
    template: 'd4Secondary',
    temperature: 0.4,
    responseSchema: 'd4Secondary',
    input: z.object({ phenomenon: text, d4: d4Snapshot.refine((d4) => d4.fixedRootCauseIds.length > 0) }),
    buildUserContent: ({ phenomenon, d4 }, { problemContext }) => ({
      text: `PHENOMENON: ${phenomenon}\n\nCAUSES LIST:\n${causesPayload(fixedRootCauses(d4.fixedRootCauseIds, d4.fiveWhysHistory, d4.syntheticCause))}${problemContext}`,
    }),
    toResult: (raw, { d4 }, ctx) => {
      const secondaryActions = buildSecondaryActions(ctx.language, raw, d4.fixedRootCauseIds, d4.secondaryActions);
      return { secondaryActions, acpPlans: buildAcpPlans(ctx, d4, secondaryActions) };
    },
  }),

  d5Improvement: define({
    template: 'd4Secondary',
    temperature: 0.4,
    responseSchema: 'd4Secondary',
    input: z.object({ phenomenonText: z.string().min(1) }),
    buildUserContent: ({ phenomenonText }, { problemContext }) => ({
      text: `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nGenera exactamente 4 acciones concretas de mejora (ACP) para esta Oportunidad de Mejora.${problemContext}`,
    }),
    toResult: (raw, { phenomenonText }, ctx) => ({ acpPlans: [buildImprovementPlan(ctx, raw, phenomenonText)], step: 1 }),
  }),

  d5RefreshImprovement: define({
    template: 'd4Secondary',
    temperature: 0.5,
    responseSchema: 'd4Secondary',
    input: z.object({
      phenomenonText: z.string().min(1),
      acpPlans: looseArray<AcpPlan>().refine((plans) => plans.length > 0, { message: 'No hay un plan de acciones generado' }),
    }),
    buildUserContent: ({ phenomenonText, acpPlans }, { problemContext }) => {
      const { existing, newCount } = improvementTarget(acpPlans);
      return {
        text: `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nACCIONES EXISTENTES (NO REPETIR): ${existing.map((a) => a.action).join(' | ')}\n\nGenera exactamente ${newCount} acciones concretas de mejora NUEVAS y DIFERENTES a las existentes.${problemContext}`,
      };
    },
    toResult: (raw, { acpPlans }, ctx) => ({ acpPlans: refreshImprovementPlans(ctx, raw, acpPlans) }),
  }),

  d5Implementation: define({
    template: 'd5Implementation',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ action: optionalText, responsible: optionalText, timeframe: optionalText }),
    buildUserContent: ({ action, responsible, timeframe }, { problemContext }) => ({
      text: `ACTION: ${action}\nRESPONSIBLE: ${responsible}\nTIMEFRAME: ${timeframe}${problemContext}`,
    }),
  }),

  d5Poka: define({
    template: 'd5Poka',
    temperature: 0.5,
    responseSchema: 'd5Poka',
    input: z.object({
      fiveWhysHistory: looseArray<FiveWhysAnalysis>().refine((history) => history.length > 0, { message: 'Se requiere un análisis de causa raíz' }),
      pokaYokes: looseArray<PokaYokeSolution>(),
    }),
    buildUserContent: ({ fiveWhysHistory }, { problemContext }) => ({
      text: `Root Cause: ${fiveWhysHistory[fiveWhysHistory.length - 1]?.systemicRootCause}${problemContext}`,
    }),
    toResult: (raw, { pokaYokes }) => ({ pokaYokes: mergePokaYokes(pokaYokes, raw?.solutions || []) }),
  }),

  pokaDetail: define({
    template: 'pokaDetail',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ description: optionalText }),
    buildUserContent: ({ description }) => ({ text: `Solution: ${description}.` }),
  }),

  d5A3: define({
    template: 'd5A3',
    temperature: 0.4,
    responseSchema: 'd5A3',
    input: z.object({
      phenomenon: text,
      totalLoss: text,
      risks: text,
      rootCauses: z.array(optionalText).default([]),
      d3: z.object({
        isNotApplicable: z.boolean().default(false),
        selectedActions: z
          .array(z.object({ action: optionalText, responsible: optionalText, implementationDate: optionalText }))
          .default([]),
      }),
      acpPlans: z.array(acpPlan).default([]),
      pokaYokes: z.array(z.object({ description: optionalText, level: optionalText, isConfirmed: z.boolean().optional() })).default([]),
      poe: text,
      yokoTen: text,
      efficacyProtocols: z
        .array(
          z.object({
            id: optionalText,
            action: optionalText,
            verificationMethod: optionalText,
            verificationResponsible: optionalText,
            verificationDate: optionalText,
            isEffective: z.unknown().optional(),
          }),
        )
        .default([]),
      responsible: text,
      /** Fecha de generación en el formato local del usuario. */
      generatedOn: text,
    }),
    buildUserContent: (input, { language }) => {
      const es = language === 'es';
      const d3ActionText = input.d3.isNotApplicable
        ? es
          ? 'No aplica para este caso'
          : 'Not applicable for this case'
        : input.d3.selectedActions.length > 0
          ? input.d3.selectedActions
              .map((a) => `${es ? 'D3 CORRECCIÓN' : 'D3 CORRECTION'}: ${a.action} | RESP: ${a.responsible} | DATE: ${a.implementationDate}`)
              .join('\n')
          : 'None';

      const acpActionsFormatted = input.acpPlans
        .map((plan) => {
          const fixed = plan.actions.filter((a) => a.isFixed);
          if (fixed.length === 0) return null;
          return `${plan.type === 'primary' ? 'MASTER' : 'SECONDARY'}: ${plan.rootCause}\n${fixed
            .map((a) => `- [ID: ${a.actionId || 'N/A'}] ${a.action} (RESP: ${a.responsible}, DATE: ${a.timeframe})`)
            .join('\n')}`;
        })
        .filter(Boolean)
        .join('\n\n');

      const pokaYokesFormatted = input.pokaYokes
        .filter((p) => p.isConfirmed)
        .map((p) => `- ${p.description} (${p.level})`)
        .join('\n');

      const poeName = input.poe ? 'POE Implementado' : 'TBD';
      const yokoTenSummary = input.yokoTen || 'TBD';

      const efficacyFormatted = input.efficacyProtocols
        .map(
          (p) =>
            `- [ID: ${p.id}] Action: ${p.action} | Method: ${p.verificationMethod} | Responsible: ${p.verificationResponsible} | Date: ${p.verificationDate} | Effective: ${p.isEffective ? 'SI' : 'NO'}`,
        )
        .join('\n');

      return {
        text: `
      PHENOMENON: ${input.phenomenon}
      FINANCIAL: ${input.totalLoss}
      RISKS: ${input.risks}
      CAUSES: ${input.rootCauses.join('; ')}
      D3_CORRECCION: ${d3ActionText}
      ACP_ACTIONS: ${acpActionsFormatted}
      POKAS: ${pokaYokesFormatted}
      POE_NAME: ${poeName}
      YOKOTEN: ${yokoTenSummary}
      EFFICACY_VALIDATION: ${efficacyFormatted}
      RESPONSIBLE: ${input.responsible}
      DATE: ${input.generatedOn}
    `,
      };
    },
    toResult: (raw) => ({ a3Report: raw }),
  }),

  d7Poe: define({
    template: 'd7Poe',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ acpPlans: z.array(acpPlan).default([]) }),
    buildUserContent: ({ acpPlans }) => {
      const actions = fixedActionsOf(acpPlans)
        .map((a) => `[ID: ${a.actionId || 'N/A'}] ${a.action}`)
        .join('; ');
      return { text: `ACTIONS: ${actions}` };
    },
    toResult: (raw) => ({ poe: raw || '' }),
  }),

  d7YokoTen: define({
    template: 'd7YokoTen',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ phenomenon: text, rootCauses: z.array(optionalText).default([]) }),
    buildUserContent: ({ phenomenon, rootCauses }) => ({ text: `PHENOMENON: ${phenomenon}\nROOT: ${rootCauses.join('; ')}` }),
    toResult: (raw) => ({ yokoTen: raw || '' }),
  }),

  d7Quiz: define({
    template: 'd7Quiz',
    temperature: 0.3,
    responseSchema: 'd7Quiz',
    input: z.object({ poe: z.string().min(1) }),
    buildUserContent: ({ poe }) => ({ text: `POE: ${poe}` }),
    toResult: (raw) => ({ quiz: raw?.questions || [] }),
  }),

  efficacyValidation: define({
    template: 'efficacyValidation',
    temperature: 0.4,
    responseSchema: 'efficacyValidation',
    input: z.object({ acpPlans: z.array(acpPlan).default([]), rootCauses: z.array(optionalText).default([]) }),
    buildUserContent: ({ acpPlans, rootCauses }) => {
      const actionsText = fixedActionsOf(acpPlans)
        .map((a) => `- [ID: ${a.actionId || 'N/A'}] ${a.action} (Responsable: ${a.responsible})`)
        .join('\n');
      const rootCausesText = rootCauses.filter(Boolean).join('; ');
      return { text: `CAUSAS RAIZ:\n${rootCausesText}\n\nACCIONES GENERADAS EN D5:\n${actionsText}` };
    },
    toResult: (raw, { acpPlans }, ctx) => ({
      protocols: [buildEfficacyProtocol(ctx, raw, fixedActionsOf(acpPlans) as ActionStep[])],
    }),
  }),

  verificationGuide: define({
    template: 'verificationGuide',
    temperature: 0.5,
    responseSchema: null,
    input: z.object({ verificationMethod: optionalText }),
    buildUserContent: ({ verificationMethod }) => ({ text: `Método de Verificación: ${verificationMethod}` }),
  }),
};

export type AiOperationName = keyof typeof aiOperations;

export const aiOperationNames = Object.keys(aiOperations) as AiOperationName[];
