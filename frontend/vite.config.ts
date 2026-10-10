import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Política de seguridad de contenido: solo scripts propios y conexión únicamente al backend. */
const buildCsp = (apiUrl: string | undefined) => {
  const apiOrigin = apiUrl ? new URL(apiUrl).origin : '';
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
};

// Solo en el build de producción: el servidor de desarrollo de Vite usa scripts en línea.
const cspPlugin = (apiUrl: string | undefined): Plugin => ({
  name: 'kitacr8d-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp(apiUrl)}">`),
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      // En desarrollo las llamadas a /api se envían al backend local.
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:8080', changeOrigin: true },
      },
    },
    plugins: [react(), cspPlugin(env.VITE_API_URL || undefined)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
