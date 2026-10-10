import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { pool } from './db/pool.js';
import { logger } from './utils/logger.js';

async function main() {
  await runMigrations();

  const server = createApp().listen(env.PORT, () => {
    logger.info('API iniciada', { port: env.PORT, env: env.NODE_ENV, authMode: env.AUTH_MODE, aiProvider: env.AI_PROVIDER });
  });

  // Las respuestas de la IA pueden tardar: se amplían los tiempos de espera del servidor HTTP.
  server.requestTimeout = 10 * 60 * 1000;
  server.headersTimeout = 65 * 1000;

  const shutdown = (signal: string) => {
    logger.info('Cerrando API', { signal });
    server.close(() => {
      void pool.end().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  logger.error('No se pudo iniciar la API', { error: error instanceof Error ? error.stack : String(error) });
  process.exit(1);
});
