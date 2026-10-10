import { z } from 'zod';
import type { ResponseSchemaKey } from './prompts/responseSchemas.js';
import type { Language, TemplateKey } from './prompts/templates.js';

export interface ImagePart {
  mimeType: string;
  data: string;
}

export interface UserContent {
  text: string;
  images?: ImagePart[];
}

export interface BuildContext {
  language: Language;
  /** Contexto del problema definido en D2 (vacío si aún no existe). */
  problemContext: string;
}

export interface OperationDefinition<TInput> {
  template: TemplateKey;
  temperature: number;
  responseSchema: ResponseSchemaKey | null;
  input: z.ZodType<TInput>;
  buildUserContent: (input: TInput, ctx: BuildContext) => UserContent;
}

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const optionalText = z.string().nullish();

const causeRef = z.object({ id: z.string(), text: optionalText });

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

const fixedActionsOf = (plans: z.infer<typeof acpPlan>[]) => plans.flatMap((plan) => plan.actions || []).filter((a) => a.isFixed);

const causesPayload = (causes: z.infer<typeof causeRef>[]) =>
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
  }),

  d3: define({
    template: 'd3',
    temperature: 0.3,
    responseSchema: 'd3',
    input: z.object({ caseName: text, phenomenon: text }),
    buildUserContent: ({ caseName, phenomenon }, { problemContext }) => ({
      text: `Case: ${caseName}. Phenomenon: ${phenomenon}.${problemContext}`,
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
  }),

  d4Ishikawa: define({
    template: 'd4Ishikawa',
    temperature: 0.4,
    responseSchema: 'd4Ishikawa',
    input: z.object({
      phenomenon: text,
      existingCauses: z.array(z.object({ category: z.string(), text: optionalText })).default([]),
    }),
    buildUserContent: ({ phenomenon, existingCauses }, { problemContext }) => {
      const existing = existingCauses.map((c) => `[${c.category}]: ${c.text}`).join('; ');
      const suffix = existing ? `\n\nEXISTING CAUSES (DO NOT REPEAT THESE, GENERATE NEW AND DIFFERENT ONES): ${existing}` : '';
      return { text: `Phenomenon: ${phenomenon}${problemContext}${suffix}` };
    },
  }),

  d4Gemba: define({
    template: 'd4Gemba',
    temperature: 0.3,
    responseSchema: 'd4Gemba',
    input: z.object({ causes: z.array(causeRef).min(1) }),
    buildUserContent: ({ causes }, { problemContext }) => {
      const causesText = causes.map((h) => `ID: ${h.id} - Cause: ${h.text}`).join(', ');
      return { text: `Causes to audit: ${causesText}.${problemContext}` };
    },
  }),

  d4Verify: define({
    template: 'd4Verify',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ phenomenon: text, causes: z.array(optionalText).min(1) }),
    buildUserContent: ({ phenomenon, causes }, { problemContext }) => {
      const causesText = causes.map((cause) => `- Cause: ${cause}`).join('\n');
      return { text: `PHENOMENON: ${phenomenon}\n\nLIST OF CAUSES:\n${causesText}${problemContext}` };
    },
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
  }),

  d4CombinedCause: define({
    template: 'd4CombinedCause',
    temperature: 0.5,
    responseSchema: 'd4CombinedCause',
    input: z.object({ phenomenon: text, rootCauses: z.array(optionalText).min(1) }),
    buildUserContent: ({ phenomenon, rootCauses }, { problemContext }) => ({
      text: `PHENOMENON: ${phenomenon}\nROOT CAUSES: ${rootCauses.join('; ')}${problemContext}`,
    }),
  }),

  d4Secondary: define({
    template: 'd4Secondary',
    temperature: 0.4,
    responseSchema: 'd4Secondary',
    input: z.object({ phenomenon: text, causes: z.array(causeRef).min(1) }),
    buildUserContent: ({ phenomenon, causes }, { problemContext }) => ({
      text: `PHENOMENON: ${phenomenon}\n\nCAUSES LIST:\n${causesPayload(causes)}${problemContext}`,
    }),
  }),

  d5Improvement: define({
    template: 'd4Secondary',
    temperature: 0.4,
    responseSchema: 'd4Secondary',
    input: z.object({ phenomenonText: z.string().min(1) }),
    buildUserContent: ({ phenomenonText }, { problemContext }) => ({
      text: `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nGenera exactamente 4 acciones concretas de mejora (ACP) para esta Oportunidad de Mejora.${problemContext}`,
    }),
  }),

  d5RefreshImprovement: define({
    template: 'd4Secondary',
    temperature: 0.5,
    responseSchema: 'd4Secondary',
    input: z.object({
      phenomenonText: z.string().min(1),
      existingActions: z.array(optionalText).default([]),
      count: z.number().int().min(1).max(10),
    }),
    buildUserContent: ({ phenomenonText, existingActions, count }, { problemContext }) => ({
      text: `OPORTUNIDAD DE MEJORA / FENÓMENO: ${phenomenonText}\n\nACCIONES EXISTENTES (NO REPETIR): ${existingActions.join(' | ')}\n\nGenera exactamente ${count} acciones concretas de mejora NUEVAS y DIFERENTES a las existentes.${problemContext}`,
    }),
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
    input: z.object({ rootCause: optionalText }),
    buildUserContent: ({ rootCause }, { problemContext }) => ({ text: `Root Cause: ${rootCause}${problemContext}` }),
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
  }),

  d7YokoTen: define({
    template: 'd7YokoTen',
    temperature: 0.4,
    responseSchema: null,
    input: z.object({ phenomenon: text, rootCauses: z.array(optionalText).default([]) }),
    buildUserContent: ({ phenomenon, rootCauses }) => ({ text: `PHENOMENON: ${phenomenon}\nROOT: ${rootCauses.join('; ')}` }),
  }),

  d7Quiz: define({
    template: 'd7Quiz',
    temperature: 0.3,
    responseSchema: 'd7Quiz',
    input: z.object({ poe: z.string().min(1) }),
    buildUserContent: ({ poe }) => ({ text: `POE: ${poe}` }),
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
