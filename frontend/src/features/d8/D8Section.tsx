import { useState } from 'react';
import { type AppState } from '../../types';
import { ArrowPathIcon, DocumentTextIcon, QuestionMarkCircleIcon, CheckBadgeIcon, Square2StackIcon } from '@heroicons/react/24/outline';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { INITIAL_STATE } from '../../shared/constants/initialState';

export const D8Section = ({ state, setState, runAi, loading, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d8: INITIAL_STATE.d8
    }));
  };

  const [activeSubTab, setActiveSubTab] = useState<'standard' | 'yokoten' | 'quiz'>('standard');
  const [poeViewMode, setPoeViewMode] = useState<'edit' | 'preview'>('preview');
  const [yokoViewMode, setYokoViewMode] = useState<'edit' | 'preview'>('preview');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const generatePOE = () => { 
    runAi('d7Poe', 'd7Poe', { acpPlans: state.d5_d6.acpPlans || [] }, (data) => setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), poe: (data as string) || "" } }))); 
  };
  
  const generateYokoTen = () => { 
    const history = state.d4.fiveWhysHistory || []; 
    runAi('d7YokoTen', 'd7YokoTen', { phenomenon: state.d2.phenomenon, rootCauses: history.map(h => h.systemicRootCause) }, (data) => setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), yokoTen: (data as string) || "" } }))); 
  };
  
  const generateQuiz = () => { 
    if (!state.d8.poe) return alert("POE first."); 
    runAi('d7Quiz', 'd7Quiz', { poe: state.d8.poe }, (data) => { 
      setState((p: AppState) => ({ ...p, d8: { ...(p.d8 || {}), quiz: (data as any)?.questions || [] } })); 
      setScore(null); 
      setAnswers({}); 
    }); 
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ArrowPathIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d7')}</h2>
              <button onClick={() => setBanner({ title: t('d7'), content: t('d7Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('closureCycle')}
              <button onClick={() => setBanner({ title: t('closureCycle'), content: t('d7Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
            <div className="flex gap-4 mb-4">
        {(['standard', 'yokoten', 'quiz'] as const).map(tabId => (
          <button 
            key={tabId} 
            onClick={() => setActiveSubTab(tabId)} 
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${activeSubTab === tabId ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
          >
            {tabId === 'standard' ? <DocumentTextIcon className="w-4 h-4" /> : tabId === 'yokoten' ? <Square2StackIcon className="w-4 h-4" /> : <CheckBadgeIcon className="w-4 h-4" />}
            {tabId === 'standard' ? t('standardPOE') : tabId === 'yokoten' ? t('yokotenTab') : t('certTab')}
            <QuestionMarkCircleIcon 
              className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] cursor-help transition-all transform hover:scale-125" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setBanner({ 
                  title: tabId === 'standard' ? t('standardPOE') : tabId === 'yokoten' ? t('yokotenTab') : t('certTab'), 
                  content: tabId === 'standard' ? t('d7PoeBanner') : tabId === 'yokoten' ? t('yokotenBanner') : t('d7QuizBanner') 
                }); 
              }} 
            />
          </button>
        ))}
      </div>
      <div className="industrial-card rounded-[2rem] p-10 bg-white h-auto flex flex-col">
        {activeSubTab === 'standard' && (
          <div className="animate-slide-in h-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  {t('protocolTitle')}
                  <button onClick={() => setBanner({ title: t('protocolTitle'), content: t('d7PoeBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setPoeViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${poeViewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                  <button onClick={() => setPoeViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${poeViewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
                </div>
              </div>
              <button onClick={generatePOE} disabled={loading === 'd7Poe'} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">
                {loading === 'd7Poe' ? '...' : t('genStd')}
              </button>
            </div>
            <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white min-h-[500px] h-auto flex flex-col">
              {poeViewMode === 'edit' ? (
                <AutoExpandingTextarea 
                  value={state.d8.poe} 
                  onChange={(e: any) => setState((p: AppState) => ({ ...p, d8: { ...p.d8, poe: e.target.value } }))}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium focus:ring-0 outline-none transition-all leading-relaxed"
                  placeholder="Escriba el procedimiento operativo estándar aquí..."
                />
              ) : (
                state.d8.poe ? renderStyledMarkdown(state.d8.poe) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>
              )}
            </div>
          </div>
        )}
        {activeSubTab === 'yokoten' && (
          <div className="animate-slide-in h-auto flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">{t('yokotenTab')} <button onClick={() => setBanner({ title: t('yokotenTab'), content: t('yokotenBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button onClick={() => setYokoViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${yokoViewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                  <button onClick={() => setYokoViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${yokoViewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
                </div>
              </div>
              <button onClick={generateYokoTen} disabled={loading === 'd7YokoTen'} className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">
                {loading === 'd7YokoTen' ? '...' : t('deploy')}
              </button>
            </div>
            <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white min-h-[500px] h-auto flex flex-col">
              {yokoViewMode === 'edit' ? (
                <AutoExpandingTextarea 
                  value={state.d8.yokoTen} 
                  onChange={(e: any) => setState((p: AppState) => ({ ...p, d8: { ...p.d8, yokoTen: e.target.value } }))}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium focus:ring-0 outline-none transition-all leading-relaxed"
                  placeholder="Escriba el informe de despliegue horizontal aquí..."
                />
              ) : (
                state.d8.yokoTen ? renderStyledMarkdown(state.d8.yokoTen) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>
              )}
            </div>
          </div>
        )}
        {activeSubTab === 'quiz' && (<div className="animate-slide-in h-auto flex flex-col"><div className="flex justify-between items-center mb-8"><h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    {t('certification')}
                    <button onClick={() => setBanner({ title: t('certification'), content: t('d7QuizBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                      <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                    </button>
                  </h3><button onClick={generateQuiz} disabled={loading === 'd7Quiz'} className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md flex items-center gap-2">{loading === 'd7Quiz' ? '...' : t('createExam')}</button></div>{state.d8.quiz && state.d8.quiz.length > 0 ? (<div className="space-y-8 h-auto flex flex-col">{state.d8.quiz.map((q: any, i: number) => (<div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-3xl h-auto flex flex-col"><p className="text-[10px] font-black text-slate-400 uppercase mb-4">{state.language === 'es' ? 'Pregunta' : 'Question'} #{i+1}</p><h4 className="text-sm font-bold text-slate-900 mb-6">{q.question_text}</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{q.options.map((opt: string, optIdx: number) => (<label key={optIdx} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${answers[i] === optIdx ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700'}`}><input type="radio" name={`q-${i}`} className="hidden" checked={answers[i] === optIdx} onChange={() => setAnswers({ ...answers, [i]: optIdx })} /><span className="text-xs font-bold leading-tight">{opt}</span></label>))}</div></div>))}<div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-6"><button onClick={() => { let correctCount = 0; state.d8.quiz.forEach((q: any, i: number) => { if (answers[i] === q.correct_answer) correctCount++; }); setScore(correctCount); }} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 active:scale-[0.95]">{t('grade')}</button>{score !== null && <div className={`p-8 rounded-full border-4 flex flex-col items-center justify-center aspect-square w-48 shadow-2xl animate-scale-up ${score >= 4 ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-red-50 border-red-400 text-red-600'}`}><p className="text-5xl font-black mono">{score}/5</p></div>}</div></div>) : <div className="py-24 text-center opacity-30 italic">{t('waitingAnalysis')}</div>}</div>)}
      </div>
    </div>
  );
};
