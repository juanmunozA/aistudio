import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import type { Banner } from '../../features/sectionProps';
import type { TranslateFn } from '../../i18n';

// Las ayudas de D0 y D4 tienen más contenido: se muestran en una ventana más grande.
const LARGE_BANNER_KEYWORDS = ['d4', 'análisis forense', 'analisis forense', 'causa raíz', 'causa raiz', 'd0', 'configuración', 'configuracion'];

/** Ventana de ayuda contextual de cada sección. */
export const HelpBanner: React.FC<{ banner: Banner; t: TranslateFn; onClose: () => void }> = ({ banner, t, onClose }) => {
  const isLarge = LARGE_BANNER_KEYWORDS.some((keyword) => banner.title?.toLowerCase().includes(keyword));
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`bg-white rounded-[2.5rem] shadow-2xl ${
        isLarge
          ? 'max-w-[1272px] max-h-[770px]' 
          : 'max-w-2xl max-h-[500px]'
      } w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col`}>
        <div className="bg-amber-500 p-4 flex items-center gap-4">
          <div className="p-2 bg-white/20 rounded-xl">
            <QuestionMarkCircleIcon className="w-7 h-7 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter">{banner.title}</h3>
            <p className="text-xs font-bold text-amber-100 uppercase tracking-widest">{t('tutorialSubtitle')}</p>
          </div>
        </div>
        <div className="p-8 overflow-y-auto custom-scroll">
          <p className="text-slate-600 font-medium leading-relaxed text-base mb-6">
            {banner.content}
          </p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-[0.95]"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
