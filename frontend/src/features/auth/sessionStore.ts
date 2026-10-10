import type { IssuedSession } from '../../services/api/authApi';

// La sesión vive en sessionStorage: sobrevive a recargar la página y se borra al cerrar la pestaña.
const KEY = 'kitacr8d:session';

let current: IssuedSession | null = null;

const read = (): IssuedSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as IssuedSession) : null;
  } catch {
    return null;
  }
};

export const sessionStore = {
  load(): IssuedSession | null {
    current = read();
    if (current && new Date(current.expiresAt).getTime() <= Date.now()) {
      this.clear();
    }
    return current;
  },

  save(session: IssuedSession) {
    current = session;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {
      // Sin almacenamiento disponible la sesión dura mientras la página esté abierta.
    }
  },

  clear() {
    current = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // Nada que limpiar.
    }
  },

  getToken(): string | null {
    return current?.accessToken ?? null;
  },
};
