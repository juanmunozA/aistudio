import React from 'react';
import { useAuth } from './AuthProvider';
import { LoginView } from './LoginView';

/** Guard: la aplicación solo se muestra con una sesión válida; si no, se muestra el login. */
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <LoginView />;
  // La clave por usuario reinicia la aplicación al cambiar de sesión.
  return <React.Fragment key={user.sub}>{children}</React.Fragment>;
};
