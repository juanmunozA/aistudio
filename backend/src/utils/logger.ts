type Level = 'info' | 'warn' | 'error';

// Logs estructurados en JSON, legibles por el servicio de monitoreo de la nube.
function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry = { level, message, time: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
