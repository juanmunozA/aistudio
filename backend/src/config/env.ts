import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value : undefined));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(8080),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    BODY_LIMIT: z.string().default('25mb'),

    DATABASE_URL: z.string().min(1),
    DATABASE_SSL: boolFromString,

    AUTH_MODE: z.enum(['local', 'oidc']).default('local'),
    JWT_SECRET: optionalString,
    JWT_ISSUER: z.string().default('kitacr8d-api'),
    JWT_AUDIENCE: z.string().default('kitacr8d-web'),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(28800),
    OIDC_JWKS_URI: optionalString,
    OIDC_ISSUER: optionalString,
    OIDC_AUDIENCE: optionalString,

    AI_PROVIDER: z.enum(['azure-openai', 'gemini']).default('azure-openai'),
    AZURE_OPENAI_ENDPOINT: optionalString,
    AZURE_OPENAI_API_KEY: optionalString,
    AZURE_OPENAI_DEPLOYMENT: optionalString,
    AZURE_OPENAI_API_VERSION: z.string().default('2024-10-21'),
    GEMINI_API_KEY: optionalString,
    GEMINI_MODEL: z.string().default('gemini-3-flash-preview'),

    STORAGE_PROVIDER: z.enum(['local', 'azure-blob']).default('local'),
    STORAGE_LOCAL_DIR: z.string().default('./storage'),
    AZURE_STORAGE_CONNECTION_STRING: optionalString,
    AZURE_STORAGE_CONTAINER: z.string().default('kitacr8d-adjuntos'),
    /** Secreto para firmar las URLs de adjuntos (si se omite se usa JWT_SECRET). */
    ATTACHMENT_URL_SECRET: optionalString,
    ATTACHMENT_URL_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  })
  .superRefine((env, ctx) => {
    if (env.AUTH_MODE === 'local' && (!env.JWT_SECRET || env.JWT_SECRET.length < 32)) {
      ctx.addIssue({ code: 'custom', path: ['JWT_SECRET'], message: 'Debe tener al menos 32 caracteres en AUTH_MODE=local' });
    }
    if (env.STORAGE_PROVIDER === 'azure-blob' && !env.AZURE_STORAGE_CONNECTION_STRING) {
      ctx.addIssue({ code: 'custom', path: ['AZURE_STORAGE_CONNECTION_STRING'], message: 'Obligatoria con STORAGE_PROVIDER=azure-blob' });
    }
    if (!env.ATTACHMENT_URL_SECRET && !env.JWT_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['ATTACHMENT_URL_SECRET'], message: 'Defina ATTACHMENT_URL_SECRET (o JWT_SECRET) para firmar las URLs de adjuntos' });
    }
    if (env.AUTH_MODE === 'oidc' && (!env.OIDC_JWKS_URI || !env.OIDC_ISSUER || !env.OIDC_AUDIENCE)) {
      ctx.addIssue({ code: 'custom', path: ['OIDC_JWKS_URI'], message: 'OIDC_JWKS_URI, OIDC_ISSUER y OIDC_AUDIENCE son obligatorios en AUTH_MODE=oidc' });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
  throw new Error(`Configuración inválida del entorno:\n${details}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
