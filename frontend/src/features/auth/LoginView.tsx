import React, { useState } from 'react';
import { BuildingOffice2Icon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { ApiError } from '../../services/api/httpClient';
import { useAuth } from './AuthProvider';

const texts = {
  es: {
    title: 'Kit ACR-8D',
    subtitle: 'Análisis de causa raíz con IA',
    username: 'Usuario',
    password: 'Contraseña',
    submit: 'Iniciar sesión',
    loading: 'Ingresando...',
    invalid: 'Usuario o contraseña incorrectos.',
    network: 'No hay conexión con el servidor. Intente de nuevo.',
    expired: 'Su sesión expiró. Inicie sesión nuevamente.',
    switchLang: 'English',
  },
  en: {
    title: 'ACR-8D Kit',
    subtitle: 'AI-powered root cause analysis',
    username: 'Username',
    password: 'Password',
    submit: 'Sign in',
    loading: 'Signing in...',
    invalid: 'Invalid username or password.',
    network: 'Cannot reach the server. Please try again.',
    expired: 'Your session expired. Please sign in again.',
    switchLang: 'Español',
  },
};

export const LoginView: React.FC = () => {
  const { login, expired } = useAuth();
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = texts[lang];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 0 ? t.network : t.invalid);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-200 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl shadow-md">
              <BuildingOffice2Icon className="w-6 h-6 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">{t.title}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            {t.switchLang}
          </button>
        </div>

        {expired && !error && (
          <p className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{t.expired}</p>
        )}
        {error && <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

        <label className="block space-y-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.username}</span>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-500">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.password}</span>
          <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-blue-500">
            <LockClosedIcon className="w-4 h-4 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-60 transition-all"
        >
          {submitting ? t.loading : t.submit}
        </button>
      </form>
    </div>
  );
};
