import { type AppState } from '../../types';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

export const ImprovementReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  return (
    <div id="improvement-report-content" className="official-document p-10 space-y-8 bg-white text-slate-900 font-sans max-w-[1000px] mx-auto">
      <div className="flex justify-between items-start border-b-4 border-orange-500 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 text-orange-600">
            {t('improvementOpportunityReport')}
          </h1>
          <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{state.setup.caseName || (t('improvementOpportunity2'))}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('responsible')}: {state.setup.responsible}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('startDate')}: {(() => { if (!state.setup.startDate) return ""; const [y, m, d] = state.setup.startDate.split('-'); return `${d}-${m}-${y}`; })()}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('issueDate')}: {(() => { const now = new Date(); return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`; })()}</p>
        </div>
      </div>
      
      {/* FASE D0: CONFIGURACIÓN */}
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-4">
          D0: {t('improvementConfiguration')}
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseType')}</label>
            <p className="font-bold text-sm text-slate-800">{state.setup.type}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('impacts')} / {t('standards')}</label>
            <p className="font-bold text-sm text-slate-800">
              {(() => {
                const items = [...(state.setup.impact || []), ...(state.setup.standards || [])];
                return items.map(item => {
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherImpact) return `${item} (${state.setup.otherImpact})`;
                  if ((item === 'Otros' || item === 'Others') && state.setup.otherStandard) return `${item} (${state.setup.otherStandard})`;
                  return item;
                }).join(', ');
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* FASE D1: OPORTUNIDAD DE MEJORA / FENOMENOLOGÍA */}
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-4">
          D1: {t('improvementOpportunityDescription')}
        </h2>
        <div className="space-y-6">
          <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 block">
              {t('improvementOpportunityPhenomenon')}
            </label>
            <p className="text-sm font-bold text-slate-800 italic leading-relaxed">
              "{state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName}"
            </p>
          </div>
          {state.d2.fiveW2H && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                {t('structured5w2hAnalysis')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(state.d2.fiveW2H).map(([k, v]) => (
                  <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="text-[9px] font-black text-slate-400 uppercase block border-b border-slate-100 mb-1">{t(k) || k}</label>
                    <p className="text-[11px] font-bold text-slate-700">{String(v)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FASE D5: GESTIÓN ACP - PLAN DE ACCIONES DE MEJORA */}
      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-orange-200 text-orange-700 pb-3 mb-6">
          D5: {t('acpManagementImprovementActionPlan')}
        </h2>
        <div className="space-y-8">
          {state.d5_d6.acpPlans.length === 0 ? (
            <p className="text-sm italic text-slate-400">
              {t('noImprovementActionsGeneratedYet')}
            </p>
          ) : (
            state.d5_d6.acpPlans.map((plan, pIdx) => (
              <div key={pIdx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-orange-500 text-white">
                    {t('improvementPlan')}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.rootCause}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {(() => {
                    const fixedActions = plan.actions.filter(a => a.isFixed);
                    if (fixedActions.length === 0) {
                      return (
                        <p className="text-xs italic text-slate-400 p-4">
                          {t('noFixedActionsInThisPlan')}
                        </p>
                      );
                    }
                    return fixedActions.map((a, aIdx) => (
                      <div key={aIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                            <label className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-1">
                              {a.actionId ? `ACCIÓN ${a.actionId}` : `Acción ${aIdx + 1}`}
                            </label>
                            <p className="text-xs font-bold text-slate-800">{a.action}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-black px-2 py-1 rounded uppercase bg-emerald-100 text-emerald-800">
                              {t('fixed2')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              {t('implementationEvidence')}
                            </label>
                            <p className="text-[10px] font-bold text-slate-600">{a.evidenceHow || '-'}</p>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                              {t('implementationVerification')}
                            </label>
                            <p className="text-[10px] font-bold text-slate-600">{a.verificationHow || '-'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('implementationDate')}</label>
                            <p className="text-[10px] font-bold text-slate-600">{a.timeframe || '-'}</p>
                          </div>
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
                            <p className="text-[10px] font-bold text-slate-600">{a.responsible || '-'}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale"><div className="flex items-center gap-2"><BuildingOffice2Icon className="w-5 h-5"/><span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span></div><p className="text-[9px] font-bold uppercase">{t('improvementOpportunityReportD0D1D5')}</p></div>
    </div>
  );
};
