import { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';

export const ResetButton = ({ onReset, t }: any) => {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-2 animate-slide-in">
        <button onClick={() => { onReset(); setConfirm(false); }} className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md">
          {t('confirmReset')}
        </button>
        <button onClick={() => setConfirm(false)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
          {t('cancel')}
        </button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirm(true)} className="p-2 text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 group" title={t('resetSection')}>
      <TrashIcon className="w-4 h-4" />
      <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">{t('resetSection')}</span>
    </button>
  );
};
