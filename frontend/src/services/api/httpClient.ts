import { sessionStore } from '../../features/auth/sessionStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

type UnauthorizedListener = () => void;
let onUnauthorized: UnauthorizedListener | null = null;

/** Se ejecuta cuando el backend responde 401 (sesión vencida o inválida). */
export function setUnauthorizedListener(listener: UnauthorizedListener | null) {
  onUnauthorized = listener;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Para envío de archivos: se manda tal cual, sin serializar a JSON. */
  formData?: FormData;
  auth?: boolean;
}

/** Cliente HTTP único hacia el backend: agrega el token de sesión y normaliza los errores. */
export async function apiRequest<T>(path: string, { method = 'GET', body, formData, auth = true }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? sessionStore.getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con el servidor');
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as T & ErrorBody;
  if (!response.ok) {
    if (response.status === 401 && auth) onUnauthorized?.();
    throw new ApiError(
      response.status,
      payload.error?.code ?? 'HTTP_ERROR',
      payload.error?.message ?? `Error ${response.status}`,
      payload.error?.details,
    );
  }
  return payload;
}
