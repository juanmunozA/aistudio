import { env } from '../../config/env.js';
import type { AiProvider } from './aiProvider.js';
import { AzureOpenAiProvider } from './azureOpenAiProvider.js';
import { GeminiProvider } from './geminiProvider.js';

let provider: AiProvider | undefined;

/** Proveedor de IA configurado por variables de entorno (AI_PROVIDER). */
export function getAiProvider(): AiProvider {
  if (provider) return provider;

  if (env.AI_PROVIDER === 'gemini') {
    if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada');
    provider = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  } else {
    if (!env.AZURE_OPENAI_ENDPOINT || !env.AZURE_OPENAI_API_KEY || !env.AZURE_OPENAI_DEPLOYMENT) {
      throw new Error('AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY y AZURE_OPENAI_DEPLOYMENT son obligatorias');
    }
    provider = new AzureOpenAiProvider({
      endpoint: env.AZURE_OPENAI_ENDPOINT,
      apiKey: env.AZURE_OPENAI_API_KEY,
      deployment: env.AZURE_OPENAI_DEPLOYMENT,
      apiVersion: env.AZURE_OPENAI_API_VERSION,
    });
  }
  return provider;
}

/** Solo para pruebas locales: permite reemplazar el proveedor. */
export function setAiProvider(custom: AiProvider) {
  provider = custom;
}
