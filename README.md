# Kit ACR-8D

Herramienta web de análisis de causa raíz (metodología 8D) asistida por IA.

```
frontend/   React + TypeScript + Vite + Tailwind (interfaz)
backend/    Node + TypeScript + Express + PostgreSQL (API, IA, persistencia)
```

## Arquitectura

```
Navegador ──► Frontend (estático) ──► /api ──► Backend ──► Proveedor de IA (Azure OpenAI / Gemini)
                                                   └────► PostgreSQL (casos e historial)
```

- El navegador **no** tiene llaves ni SDK de IA: envía los datos del caso al backend con el
  token de sesión, y el backend arma el prompt, el rol y el formato de respuesta.
- Backend en capas: `routes` → `controllers` → `services` → `repositories` → `models`.
- Autenticación con usuario y contraseña (JWT firmado por el backend) o SSO corporativo
  (`AUTH_MODE=oidc`, valida tokens con el JWKS del proveedor de identidad).
- Cada caso se guarda automáticamente en el servidor y en el navegador (para no perder
  trabajo al recargar o si se cae la conexión). Cada guardado deja historial: versión,
  usuario, fecha y disciplinas modificadas.

## Desarrollo local

Requisitos: Node 20+ y PostgreSQL 14+.

```bash
# 1. Backend
cd backend
cp .env.example .env          # completar DATABASE_URL, JWT_SECRET y credenciales de IA
npm install
npm run db:migrate
npm run user:create -- --username jperez --password "UnaClaveSegura1" --name "Juan Pérez"
npm run dev                   # http://localhost:8080/api

# 2. Frontend (otra terminal)
cd frontend
npm install
npm run dev                   # http://localhost:3000 (redirige /api al backend)
```

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.example`. En producción los secretos
(`JWT_SECRET`, `AZURE_OPENAI_API_KEY`, `DATABASE_URL`) se configuran en el servicio de
la nube o en un gestor de secretos; nunca en el repositorio.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión con usuario y contraseña |
| POST | `/api/auth/refresh` | Renovación del token |
| GET | `/api/auth/me` | Usuario de la sesión |
| GET/POST | `/api/cases` | Listar / crear casos del usuario |
| GET/PUT/DELETE | `/api/cases/:id` | Consultar / guardar (con versión) / eliminar |
| GET | `/api/cases/:id/history` | Historial de cambios |
| POST | `/api/cases/normalize` | Validar y migrar un JSON exportado |
| POST | `/api/ai/:operation` | Operaciones de IA (d2, d3, d4Ishikawa, ...) |
| POST | `/api/documents/extract-text` | Extraer texto de PDF, DOCX, XLSX, MD, TXT |
