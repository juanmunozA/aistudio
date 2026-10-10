import { useState } from 'react';
import { type AppState, type PokaYokeSolution } from '../../types';
import { ArrowPathIcon, DocumentTextIcon, QuestionMarkCircleIcon, PrinterIcon, PlusCircleIcon, LightBulbIcon, CheckBadgeIcon as CheckBadgeIconSolid, BoltIcon } from '@heroicons/react/24/outline';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { INITIAL_STATE } from '../../shared/constants/initialState';
import { handleDownloadPDF, printPokaYokeGuide } from '../../shared/utils/print';
import { caseActions, useCaseState } from '../../store/caseStore';
import type { SectionProps } from '../sectionProps';
import { useAiRunner } from '../ai/useAiRunner';

export const D6Section = ({ t, setBanner }: SectionProps) => {
  const state = useCaseState();
  const { runAi, loading } = useAiRunner();
  const handleResetSection = () => {
    caseActions.updateSection('d5_d6', (current) => ({
        ...current,
        pokaYokes: INITIAL_STATE.d5_d6.pokaYokes
      }));
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const generatePokaYokes = () => {
    const history = state.d4.fiveWhysHistory || [];
    if (history.length === 0) return alert(t('rcaRequired'));
    runAi<Partial<AppState['d5_d6']>>('d5Poka', 'd5Poka', { fiveWhysHistory: history, pokaYokes: state.d5_d6.pokaYokes || [] }, (result) =>
      caseActions.updateSection('d5_d6', (current) => ({ ...current, ...result })),
    );
  };
  const getPokaDetails = (id: string, solution: PokaYokeSolution) => {
    if (solution.details) return setExpandedId(expandedId === id ? null : id);
    runAi(`pokaDetail-${id}`, 'pokaDetail', { description: solution.description }, (data) => {
      caseActions.updateCase((p: AppState) => { const nextPoka = (p.d5_d6.pokaYokes || []).map(item => item.id === id ? { ...item, details: (data as string) || "" } : item); return { ...p, d5_d6: { ...p.d5_d6, pokaYokes: nextPoka } }; });
      setExpandedId(id);
    });
  };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <LightBulbIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d6')}</h2>
              <button onClick={() => setBanner({ title: t('d6'), content: t('d6Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('preventionDesign')}
              <button onClick={() => setBanner({ title: t('preventionDesign'), content: t('d6Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex justify-end gap-4">
        <button 
          onClick={() => {
            const confirmedPokas = (state.d5_d6.pokaYokes || []).filter((p: PokaYokeSolution) => p.isConfirmed && p.details);
            if (confirmedPokas.length === 0) return alert(t('noConfirmedPokaYokesWithTechnical'));
            printPokaYokeGuide(confirmedPokas);
          }}
          className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 active:scale-[0.95]"
        >
          <PrinterIcon className="w-4 h-4" /> {t('downloadFullGuidePdf')}
        </button>
        <button onClick={generatePokaYokes} disabled={loading === 'd5Poka'} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-orange-700 transition-all flex items-center gap-2 active:scale-[0.95]">{loading === 'd5Poka' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <BoltIcon className="w-4 h-4" />} {t('proposeSolutions')}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto">
        {(state.d5_d6.pokaYokes || []).map((poka: PokaYokeSolution) => (
          <div key={poka.id} className={`industrial-card rounded-[2.5rem] p-8 border-2 flex flex-col h-auto transition-all hover:shadow-2xl ${poka.isConfirmed ? 'border-blue-600 shadow-xl' : 'border-slate-100 bg-white'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <LightBulbIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { 
                    const nextPoka = (state.d5_d6.pokaYokes || []).map(item => item.id === poka.id ? { ...item, isConfirmed: !item.isConfirmed } : item); 
                    caseActions.updateSection('d5_d6', (current) => ({ ...current, pokaYokes: nextPoka })); 
                  }} 
                  className={`p-2 rounded-lg transition-all shadow-sm ${poka.isConfirmed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:text-blue-600'}`}
                >
                  {poka.isConfirmed ? <CheckBadgeIconSolid className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                </button>
                {poka.details && (
                  <button onClick={() => handleDownloadPDF(`poka-print-${poka.id}`, `Guia_PokaYoke_${poka.id}`)} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm flex items-center gap-2">
                    <PrinterIcon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">PDF</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="px-2 py-0.5 bg-orange-600 text-white text-[8px] font-black uppercase rounded-lg w-fit">{poka.type}</div>
              {poka.level && (
                <div className={`px-2 py-0.5 text-white text-[8px] font-black uppercase rounded-lg w-fit ${poka.level.toLowerCase().includes('basic') || poka.level.toLowerCase().includes('básico') ? 'bg-emerald-600' : 'bg-purple-600'}`}>
                  {poka.level}
                </div>
              )}
            </div>

            <h4 className="text-sm font-black text-slate-900 leading-tight mb-4 uppercase tracking-tight min-h-[3rem]">{poka.description}</h4>
            <div className="p-4 bg-slate-50 rounded-2xl mb-6 flex-grow border border-slate-100">
              <p className="text-[9px] font-black text-orange-600 uppercase mb-2 tracking-widest">{t('expectedBenefit')}</p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">{poka.benefit}</p>
            </div>
            <button onClick={() => getPokaDetails(poka.id, poka)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg">
              {loading === `pokaDetail-${poka.id}` ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <DocumentTextIcon className="w-3.5 h-3.5" />} 
              {expandedId === poka.id ? '...' : t('viewGuide')}
            </button>
            {expandedId === poka.id && poka.details && (
              <div id={`poka-print-${poka.id}`} className="mt-6 p-8 bg-blue-50/30 border border-blue-100 rounded-2xl shadow-inner animate-scale-up h-auto max-h-[400px] overflow-y-auto custom-scroll">
                {renderStyledMarkdown(poka.details)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
