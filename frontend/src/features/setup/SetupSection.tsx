import { Tab, type AppState, type AnalysisSetup } from '../../types';
import { ShieldCheckIcon, AdjustmentsHorizontalIcon, CalendarDaysIcon, IdentificationIcon, BookmarkSquareIcon, BriefcaseIcon, QuestionMarkCircleIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { ResetButton } from '../../shared/components/ResetButton';
import { auditStandards, deviationImpacts, foodSafetyImpacts } from '../../shared/constants/catalogs';
import { INITIAL_STATE } from '../../shared/constants/initialState';

export const SetupSection = ({ state, setState, setActiveTab, t, setBanner }: any) => {
  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      setup: INITIAL_STATE.setup
    }));
  };

  const handleChange = (field: keyof AnalysisSetup, value: any) => { 
    if (field === 'type') {
      if (value === 'Quejas de Inocuidad') {
        const validFoodSafety = ((foodSafetyImpacts as any)[state.language] || foodSafetyImpacts.es);
        const currentImpacts = state.setup.impact || [];
        const filtered = currentImpacts.filter((i: string) => validFoodSafety.includes(i));
        const newImpacts = filtered.length > 0 ? filtered : [validFoodSafety[0]];
        setState((prev: any) => ({
          ...prev,
          setup: {
            ...prev.setup,
            type: value,
            impact: newImpacts
          }
        }));
        return;
      } else if (state.setup.type === 'Quejas de Inocuidad' && value !== 'Quejas de Inocuidad') {
        const validDev = ((deviationImpacts as any)[state.language] || deviationImpacts.es);
        const currentImpacts = state.setup.impact || [];
        const filtered = currentImpacts.filter((i: string) => validDev.includes(i));
        const newImpacts = filtered.length > 0 ? filtered : [validDev[1] || validDev[0]];
        setState((prev: any) => ({
          ...prev,
          setup: {
            ...prev.setup,
            type: value,
            impact: newImpacts
          }
        }));
        return;
      }
    }
    setState((prev: any) => ({ ...prev, setup: { ...prev.setup, [field]: value } })); 
  };
  const toggleStandard = (std: string) => { const current = state.setup.standards || []; const next = current.includes(std) ? current.filter((s: string) => s !== std) : [...current, std]; handleChange('standards', next); };
  const toggleImpact = (impact: string) => { const current = state.setup.impact || []; const next = current.includes(impact) ? current.filter((i: string) => i !== impact) : [...current, impact]; handleChange('impact', next); };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <AdjustmentsHorizontalIcon className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-0.5 flex items-center gap-2">
              {t('setup')}
              <button onClick={() => setBanner({ title: t('setup'), content: t('tutD0Content') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{t('projectMgmt')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="industrial-card rounded-[2rem] p-8 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4" /> {t('startDate')}</div>
              <button onClick={() => setBanner({ title: t('startDate'), content: t('auditDateBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="date" value={state.setup.startDate} onChange={(e) => handleChange('startDate', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><BookmarkSquareIcon className="w-4 h-4" /> {t('caseName')}</div>
              <button onClick={() => setBanner({ title: t('caseName'), content: t('caseNameBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="text" placeholder={state.language === 'es' ? "Ej: Fallo en sellado..." : "Ex: Sealing failure..."} value={state.setup.caseName} onChange={(e) => handleChange('caseName', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><IdentificationIcon className="w-4 h-4" /> {t('responsible')}</div>
              <button onClick={() => setBanner({ title: t('responsible'), content: t('responsibleBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <input type="text" placeholder={state.language === 'es' ? "Analista Líder..." : "Lead Analyst..."} value={state.setup.responsible} onChange={(e) => handleChange('responsible', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4" /> {t('caseType')}
              </div>
              <button onClick={() => setBanner({ title: t('caseType'), content: t('caseTypeBanner') })} className="p-1 hover:bg-blue-50 rounded-md transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </label>
            <select value={state.setup.type} onChange={(e) => handleChange('type', e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all">
              <option value="Desviación de proceso">{t('processDeviation')}</option>
              <option value="Hallazgo de auditoría (No conformidades)">{t('auditFinding')}</option>
              <option value="Quejas de Inocuidad">{t('foodSafetyComplaints')}</option>
              <option value="Oportunidad de mejora">{t('improvementOpportunity')}</option>
              <option value="Solución Rápida (SR)">{t('quickSolution')}</option>
            </select>
          </div>
          {(state.setup.type === 'Desviación de proceso' || state.setup.type === 'Solución Rápida (SR)' || state.setup.type === 'Quejas de Inocuidad') && (
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ChartPieIcon className="w-4 h-4" /> {t('impacts')} (Selección Múltiple)
                <button onClick={() => setBanner({ title: t('impacts'), content: t('impactsBanner') })} className="ml-2 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(
                  state.setup.type === 'Quejas de Inocuidad'
                    ? ((foodSafetyImpacts as any)[state.language] || foodSafetyImpacts.es)
                    : ((deviationImpacts as any)[state.language] || deviationImpacts.es)
                ).map((impact: string) => (
                  <button 
                    key={impact} 
                    onClick={() => toggleImpact(impact)} 
                    className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${state.setup.impact?.includes(impact) ? 'bg-blue-600 border-blue-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}
                  >
                    {impact}
                  </button>
                ))}
              </div>
              {(state.setup.impact?.includes('Otros') || state.setup.impact?.includes('Others')) && (
                <div className="mt-4 animate-slide-in">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('otherImpactLabel')}</label>
                  <input 
                    type="text" 
                    value={state.setup.otherImpact || ""} 
                    onChange={(e) => handleChange('otherImpact', e.target.value)} 
                    placeholder={state.language === 'es' ? "Escriba el nombre..." : "Write the name..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}
          {(state.setup.type === 'Hallazgo de Auditoría, ACPM' || state.setup.type === 'Hallazgo de auditoría (No conformidades)' || state.setup.type === 'Oportunidad de mejora') && (
            <div className="space-y-4 md:col-span-2 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheckIcon className="w-4 h-4" /> {t('standards')}
                <button onClick={() => setBanner({ title: t('standards'), content: t('standardsBanner') })} className="ml-2 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {auditStandards.map(std => (
                  <button 
                    key={std} 
                    onClick={() => toggleStandard(std)} 
                    className={`p-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${state.setup.standards?.includes(std) ? 'bg-orange-600 border-orange-700 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-orange-200'}`}
                  >
                    {std}
                  </button>
                ))}
              </div>
              {state.setup.standards?.includes('Otros') && (
                <div className="mt-4 animate-slide-in">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">{t('otherStandardLabel')}</label>
                  <input 
                    type="text" 
                    value={state.setup.otherStandard || ""} 
                    onChange={(e) => handleChange('otherStandard', e.target.value)} 
                    placeholder={state.language === 'es' ? "Escriba el nombre..." : "Write the name..."}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-600/20 outline-none transition-all"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setActiveTab(Tab.D1_D2)} disabled={!state.setup.caseName || !state.setup.responsible} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-20 hover:bg-slate-800 transition-all active:scale-[0.95]">{t('initAnalysis')}</button>
      </div>
    </div>
  );
};
