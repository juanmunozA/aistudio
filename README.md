# Kit ACR-8D

Herramienta web de análisis de causa raíz (metodología 8D) asistida por IA.

```
frontend/   React + TypeScript + Vite + Tailwind (interfaz)
backend/    Node + TypeScript + Express + PostgreSQL (API, IA, persistencia)
```

## Arquitectura

```
Navegador ──► Frontend (estático) ──► /api ──► Backend ──► Proveedor de IA (Azure OpenAI / Gemini)
                                                   ├────► PostgreSQL (casos, historial, adjuntos)
                                                   └────► Almacenamiento (Azure Blob / disco local)
```

### Frontend (`frontend/src`)

| Carpeta | Responsabilidad |
|---|---|
| `app/` | Shell de la aplicación y layout (barra lateral, cabecera, ayudas) |
| `features/<disciplina>/` | Vistas de Setup, D1-D2 … D8 y Eficacia |
| `features/reports/` | Plantillas de los reportes PDF |
| `features/auth/`, `features/persistence/`, `features/ai/` | Sesión, guardado automático y controlador de IA |
| `store/` | Estado del caso (Zustand) con acciones por disciplina |
| `services/` | Cliente HTTP y servicios de la API |
| `shared/` | Componentes, constantes y utilidades reutilizables |
| `i18n/` | Diccionarios ES/EN (react-i18next) |

### Backend (`backend/src`)

| Carpeta | Responsabilidad |
|---|---|
| `routes/` → `controllers/` → `services/` → `repositories/` | Capas MVC |
| `domain/` | Reglas de negocio de cada disciplina 8D |
| `ai/` | Operaciones de IA, prompts, formatos de respuesta y proveedores |
| `storage/` | Almacenamiento de adjuntos |
| `models/`, `middlewares/`, `db/` | DTOs y validación, autenticación y errores, migraciones |

- El navegador **no** tiene llaves ni SDK de IA: envía los datos del caso al backend con el
  token de sesión, y el backend arma el prompt, el rol y el formato de respuesta.
- Backend en capas: `routes` → `controllers` → `services` → `repositories` → `models`.
- Autenticación con usuario y contraseña (JWT firmado por el backend) o SSO corporativo
  (`AUTH_MODE=oidc`, valida tokens con el JWKS del proveedor de identidad).
- Las reglas de negocio de cada disciplina (consolidación del Ishikawa, evaluación del Gemba,
  planes ACP, Poka-Yoke, eficacia) están en el backend; el frontend solo muestra y captura.
- Las imágenes de evidencia van al almacenamiento y se muestran con URLs firmadas de corta duración.
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
| POST | `/api/domain/acp-plans` | Armar los planes ACP con las acciones de D4 (sin IA) |
| POST | `/api/attachments` | Subir una imagen de evidencia (PNG, JPG, WEBP) |
| GET | `/api/attachments/:id/url` | URL firmada vigente de un adjunto |
| GET | `/api/attachments/:id/content` | Contenido del adjunto (requiere URL firmada) |
| DELETE | `/api/attachments/:id` | Eliminar un adjunto |
| POST | `/api/exports/:type` | Excel: `full-report`, `gemba-checklist`, `acp-plan` |
