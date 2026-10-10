import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, type IssuedSession, type SessionUser } from '../../services/api/authApi';
import { setUnauthorizedListener } from '../../services/api/httpClient';
import { sessionStore } from './sessionStore';

// Se renueva el token unos minutos antes de que expire.
const REFRESH_MARGIN_MS = 5 * 60 * 1000;
const LOGOUT_LISTENERS = new Set<() => void | Promise<void>>();

interface AuthContextValue {
  user: SessionUser | null;
  /** true cuando la sesión terminó por expiración (para avisar en el login). */
  expired: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Permite que otras piezas (persistencia local) limpien sus datos al cerrar sesión. */
export function onLogout(listener: () => void | Promise<void>) {
  LOGOUT_LISTENERS.add(listener);
  return () => LOGOUT_LISTENERS.delete(listener);
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<IssuedSession | null>(() => sessionStore.load());
  const [expired, setExpired] = useState(false);

  const endSession = useCallback(async (byExpiration: boolean) => {
    // Al cerrar sesión manualmente se espera a que los listeners terminen (p. ej. guardar cambios pendientes).
    await Promise.allSettled([...LOGOUT_LISTENERS].map((listener) => listener()));
    sessionStore.clear();
    setSession(null);
    setExpired(byExpiration);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const issued = await authApi.login(username, password);
    sessionStore.save(issued);
    setExpired(false);
    setSession(issued);
  }, []);

  const logout = useCallback(() => endSession(false), [endSession]);

  // Cualquier 401 del backend cierra la sesión.
  useEffect(() => {
    setUnauthorizedListener(() => void endSession(true));
    return () => setUnauthorizedListener(null);
  }, [endSession]);

  // Renovación automática del token antes de su vencimiento.
  useEffect(() => {
    if (!session) return;
    const msUntilExpiry = new Date(session.expiresAt).getTime() - Date.now();
    const timer = window.setTimeout(
      async () => {
        try {
          const renewed = await authApi.refresh();
          sessionStore.save(renewed);
          setSession(renewed);
        } catch {
          void endSession(true);
        }
      },
      Math.max(msUntilExpiry - REFRESH_MARGIN_MS, 0),
    );
    return () => window.clearTimeout(timer);
  }, [session, endSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, expired, login, logout }),
    [session, expired, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
