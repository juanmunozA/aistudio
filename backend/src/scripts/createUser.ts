import { parseArgs } from 'node:util';
import { pool } from '../db/pool.js';
import { runMigrations } from '../db/migrate.js';
import { userRepository } from '../repositories/userRepository.js';
import { authService } from '../services/authService.js';

// Crea o actualiza un usuario: npm run user:create -- --username jperez --password "..." --name "Juan Pérez"
async function main() {
  const { values } = parseArgs({
    options: {
      username: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
    },
  });

  if (!values.username || !values.password) {
    throw new Error('Uso: npm run user:create -- --username <usuario> --password <contraseña> [--name "<nombre>"]');
  }
  if (values.password.length < 10) throw new Error('La contraseña debe tener al menos 10 caracteres');

  await runMigrations();
  const passwordHash = await authService.hashPassword(values.password);
  const user = await userRepository.upsert(values.username, passwordHash, values.name ?? values.username);
  console.log(`Usuario listo: ${user.username} (${user.id})`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
