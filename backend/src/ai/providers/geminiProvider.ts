import { GoogleGenAI } from '@google/genai';
import type { JsonSchema } from '../prompts/responseSchemas.js';
import { AiProviderError, type AiProvider, type GenerateRequest } from './aiProvider.js';

// Gemini espera los tipos del schema en mayúsculas (OBJECT, STRING, ...).
type GeminiSchema = Omit<JsonSchema, 'type' | 'properties' | 'items'> & {
  type: string;
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
};

function toGeminiSchema(schema: JsonSchema): GeminiSchema {
  return {
    ...schema,
    type: schema.type.toUpperCase(),
    properties: schema.properties
      ? Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]))
      : undefined,
    items: schema.items ? toGeminiSchema(schema.items) : undefined,
  };
}

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate({ system, user, temperature, maxOutputTokens, responseSchema }: GenerateRequest): Promise<string> {
    const contents =
      user.images && user.images.length > 0
        ? { parts: [{ text: user.text }, ...user.images.map((image) => ({ inlineData: image }))] }
        : user.text;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          systemInstruction: system,
          temperature,
          maxOutputTokens,
          ...(responseSchema && {
            responseMimeType: 'application/json',
            responseSchema: toGeminiSchema(responseSchema.schema) as never,
          }),
        },
      });
      return response.text ?? '';
    } catch (error) {
      throw new AiProviderError(`Gemini respondió con error: ${String(error)}`, true);
    }
  }
}
