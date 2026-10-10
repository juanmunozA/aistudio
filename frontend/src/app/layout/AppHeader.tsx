import React, { useEffect, useState } from 'react';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import type { SessionUser } from '../../services/api/authApi';
import type { SaveStatus } from '../../features/persistence/useCasePersistence';
import type { TranslateFn } from '../../i18n';
import { SaveStatusBadge } from '../../shared/components/SaveStatusBadge';
import type { Language } from '../../types';

interface AppHeaderProps {
  t: TranslateFn;
  lang: Language;
  saveStatus: SaveStatus;
  user: SessionUser | null;
  onLogout: () => void;
}

/** Cabecera: pantalla completa, estado del guardado y sesión del usuario. */
export const AppHeader: React.FC<AppHeaderProps> = ({ t, lang, saveStatus, user, onLogout }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err: Error) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      void document.exitFullscreen();
    }
  };

  return (
    <header className="h-16 flex-shrink-0 flex items-center justify-between px-10 bg-white border-b border-slate-200">
      <div className="flex items-center gap-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('scientificMethod')}</span><div className="h-4 w-px bg-slate-200"></div><span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{t('aiConnected')}</span></div>
      <div className="flex items-center gap-4">
        <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title={t('fullScreen')}>
          {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" /> : <ArrowsPointingOutIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />}
        </button>
        <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> {t('wcmActive')}</div>
        <SaveStatusBadge status={saveStatus} lang={lang} />
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[160px]" title={user?.username}>{user?.displayName}</span>
          <button onClick={onLogout} className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
            {t('signOut')}
          </button>
        </div>
      </div>
    </header>
  );
};
