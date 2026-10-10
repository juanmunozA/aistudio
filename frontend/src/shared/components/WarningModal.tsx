import { useState } from 'react';
import { ExclamationTriangleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

export const WarningModal = ({ onAccept, onDecline, t, lang, onToggleLanguage }: any) => {
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);

  const handleDecline = () => {
    setShowDeclineMessage(true);
    onDecline(); // This still calls the parent's decline if needed, but we'll show the message here
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-scale-up border-4 border-amber-500 relative my-auto max-h-[95vh]">
        {/* Language Toggle in Modal */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <button 
            onClick={onToggleLanguage}
            className="px-3 py-1.5 md:px-4 md:py-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-white/30 transition-all flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="w-3 h-3" />
            {t('espaOl')}
          </button>
        </div>

        <div className="p-6 md:p-10 bg-amber-500 text-white flex flex-col items-center text-center gap-3 md:gap-4 flex-shrink-0">
          <div className="p-3 md:p-4 bg-white/20 rounded-full backdrop-blur-md">
            <ExclamationTriangleIcon className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-black uppercase tracking-tighter leading-none mb-1 md:mb-2">{t('warningTitle')}</h2>
            <p className="text-[9px] md:text-xs font-bold text-amber-100 uppercase tracking-widest">{t('warningSubtitle')}</p>
          </div>
        </div>
        
        <div className="p-6 md:p-12 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <div className="prose prose-slate max-w-none">
            <p className="text-base md:text-lg font-medium text-slate-700 leading-relaxed text-center mb-6 md:mb-8 whitespace-pre-wrap">
              {t('warningBody')}
            </p>
            
            {showDeclineMessage && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-center animate-bounce">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  {t('youMustAcceptTheTermsTo')}
                </p>
              </div>
            )}

            <div className="p-4 md:p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-center">
              <p className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.2em]">
                {t('warningFooter')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center flex-shrink-0">
          <button 
            onClick={handleDecline}
            className="w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 bg-white text-slate-400 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 border-slate-200 hover:bg-slate-100 transition-all"
          >
            {t('decline')}
          </button>
          <button 
            onClick={onAccept}
            className="w-full sm:w-auto px-12 py-3 md:px-16 md:py-4 bg-emerald-600 text-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 active:scale-[0.95] transition-all"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
};
