import type { JsonSchema } from '../prompts/responseSchemas.js';
import type { UserContent } from '../operations.js';

export interface GenerateRequest {
  system: string;
  user: UserContent;
  temperature: number;
  maxOutputTokens: number;
  /** Si se define, el modelo debe responder un JSON con este formato. */
  responseSchema?: { name: string; schema: JsonSchema };
}

/** Contrato común para cualquier proveedor de IA (Azure OpenAI, Gemini, ...). */
export interface AiProvider {
  readonly name: string;
  generate(request: GenerateRequest): Promise<string>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AiProviderError';
  }
}
