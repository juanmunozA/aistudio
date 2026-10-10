// Copia los archivos SQL de migraciones al directorio de compilación.
import { cpSync } from 'node:fs';

cpSync('src/db/migrations', 'dist/db/migrations', { recursive: true });
