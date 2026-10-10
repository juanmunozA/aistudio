import { AiProviderError, type AiProvider, type GenerateRequest } from './aiProvider.js';

interface AzureOpenAiConfig {
  endpoint: string;
  apiKey: string;
  deployment: string;
  apiVersion: string;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
}

const REQUEST_TIMEOUT_MS = 120_000;

export class AzureOpenAiProvider implements AiProvider {
  readonly name = 'azure-openai';

  constructor(private readonly config: AzureOpenAiConfig) {}

  async generate({ system, user, temperature, maxOutputTokens, responseSchema }: GenerateRequest): Promise<string> {
    const { endpoint, apiKey, deployment, apiVersion } = this.config;
    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${apiVersion}`;

    const userContent =
      user.images && user.images.length > 0
        ? [
            { type: 'text', text: user.text },
            ...user.images.map((image) => ({
              type: 'image_url',
              image_url: { url: `data:${image.mimeType};base64,${image.data}` },
            })),
          ]
        : user.text;

    const body = {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature,
      max_tokens: maxOutputTokens,
      ...(responseSchema && {
        response_format: {
          type: 'json_schema',
          json_schema: { name: responseSchema.name, schema: responseSchema.schema, strict: false },
        },
      }),
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw new AiProviderError(`No se pudo conectar con Azure OpenAI: ${String(error)}`, true);
    }

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const retryable = response.status === 429 || response.status >= 500;
      throw new AiProviderError(`Azure OpenAI respondió ${response.status}: ${detail.slice(0, 300)}`, retryable);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    return data.choices?.[0]?.message?.content ?? '';
  }
}
