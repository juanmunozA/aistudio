import { Ajv, type ValidateFunction } from 'ajv';
import { z } from 'zod';
import { aiOperations, type AiOperationName, type OperationDefinition } from '../ai/operations.js';
import { extractJson } from '../ai/jsonResponse.js';
import { buildProblemContext } from '../ai/prompts/problemContext.js';
import { responseSchemas, type ResponseSchemaKey } from '../ai/prompts/responseSchemas.js';
import { composeSystemPrompt } from '../ai/prompts/roleComposer.js';
import { promptTemplates } from '../ai/prompts/templates.js';
import { AiProviderError } from '../ai/providers/aiProvider.js';
import { getAiProvider } from '../ai/providers/index.js';
import { HttpError } from '../utils/httpError.js';
import { logger } from '../utils/logger.js';

const MAX_RETRIES = 5;
const MAX_OUTPUT_TOKENS = 8192;
const SYSTEM_SUFFIX = ' IMPORTANT: Technical tone. Return only requested content. No preamble. Match the requested language.';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ajv = new Ajv({ allErrors: false, strict: false });
const validators = new Map<ResponseSchemaKey, ValidateFunction>();
const validatorFor = (key: ResponseSchemaKey) => {
  let validator = validators.get(key);
  if (!validator) {
    validator = ajv.compile(responseSchemas[key]);
    validators.set(key, validator);
  }
  return validator;
};

const optionalText = z.string().nullish();

/** Datos comunes a todas las operaciones: idioma, configuración del caso y problema definido en D2. */
export const aiRequestSchema = z.object({
  language: z.enum(['es', 'en']).default('es'),
  setup: z
    .object({
      type: optionalText,
      standards: z.array(z.string()).nullish(),
      impact: z.array(z.string()).nullish(),
    })
    .default({}),
  problem: z
    .object({
      phenomenon: optionalText,
      fiveW2H: z.record(z.string(), z.unknown()).nullish(),
    })
    .default({}),
  input: z.unknown().optional(),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;

export const aiService = {
  async run(operationName: AiOperationName, request: AiRequest): Promise<unknown> {
    const operation = aiOperations[operationName] as OperationDefinition<unknown>;
    const parsedInput = operation.input.safeParse(request.input ?? {});
    if (!parsedInput.success) throw HttpError.badRequest('Datos de entrada inválidos para la operación', z.treeifyError(parsedInput.error));

    const language = request.language;
    const setup = {
      type: request.setup.type ?? undefined,
      standards: request.setup.standards ?? undefined,
      impact: request.setup.impact ?? undefined,
    };
    const problemContext = buildProblemContext(language, {
      phenomenon: request.problem.phenomenon ?? undefined,
      fiveW2H: (request.problem.fiveW2H as Record<string, string> | null | undefined) ?? undefined,
    });

    const baseSystem = promptTemplates[language][operation.template];
    const system = `${composeSystemPrompt(baseSystem, language, setup)}${SYSTEM_SUFFIX}`;
    const user = operation.buildUserContent(parsedInput.data, { language, problemContext });
    const schemaKey = operation.responseSchema;

    const provider = getAiProvider();
    let retryCount = 0;

    while (true) {
      try {
        const output = await provider.generate({
          system,
          user,
          temperature: operation.temperature,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseSchema: schemaKey ? { name: schemaKey, schema: responseSchemas[schemaKey] } : undefined,
        });

        if (!output || output.trim() === '') throw new AiProviderError('Respuesta vacía de la IA', true);
        if (!schemaKey) return output;

        let parsed: unknown;
        try {
          parsed = JSON.parse(extractJson(output));
        } catch {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            await sleep(1500);
            continue;
          }
          throw HttpError.badGateway('La IA devolvió un JSON mal formado');
        }

        const validate = validatorFor(schemaKey);
        if (!validate(parsed)) {
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            await sleep(1500);
            continue;
          }
          // Se entrega igual: el cliente ya tolera variaciones en la forma de la respuesta.
          logger.warn('Respuesta de IA fuera del formato esperado', { operation: operationName, errors: validate.errors });
        }
        return parsed;
      } catch (error) {
        if (error instanceof HttpError) throw error;
        const retryable = !(error instanceof AiProviderError) || error.retryable;
        if (retryable && retryCount < MAX_RETRIES) {
          retryCount++;
          await sleep(Math.pow(2, retryCount) * 1000);
          continue;
        }
        logger.error('Fallo en la llamada a la IA', { operation: operationName, provider: provider.name, error: String(error) });
        throw HttpError.badGateway('No fue posible obtener respuesta de la IA');
      }
    }
  },
};
