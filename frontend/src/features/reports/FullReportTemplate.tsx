import { type AppState } from '../../types';
import { QueueListIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { mCategoriesLocal } from '../../shared/constants/catalogs';

export const FullReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  const mCategories = (mCategoriesLocal as any)[state.language] || mCategoriesLocal.es;

  // Pre-calculate all fixed actions to get global index for Audit Findings
  const allFixedActions = state.d5_d6.acpPlans.flatMap(p => p.actions.filter(a => a.isFixed));
  const caseNumberMatch = state.setup.caseName.match(/\d+/);
  const caseId = caseNumberMatch ? caseNumberMatch[0] : "";

  const extractSpecificSections = (text: string, sectionKeywords: string[]) => {
    if (!text) return "";
    const lines = text.split('\n');
    let result = "";
    let isCapturing = false;

    for (const line of lines) {
      const upperLine = line.toUpperCase();
      if (line.includes('**')) {
        const isTargetHeader = sectionKeywords.some(kw => upperLine.includes(kw.toUpperCase()));
        if (isTargetHeader) {
          isCapturing = true;
        } else {
          isCapturing = false;
        }
      }
      
      if (isCapturing) {
        result += line + '\n';
      }
    }
    return result.trim();
  };

  return (
    <div className="official-document p-10 space-y-8 bg-white text-slate-900">
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-6 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">{t('fullReport')}</h1>
          <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">{state.setup.caseName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('responsible')}: {state.setup.responsible}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{t('startDate')}: {(() => { if (!state.setup.startDate) return ""; const [y, m, d] = state.setup.startDate.split('-'); return `${d}-${m}-${y}`; })()}</p>
          <p className="text-sm font-black uppercase text-slate-400 tracking-widest">{state.language === 'es' ? 'FECHA FINAL' : 'END DATE'}: {(() => { const now = new Date(); return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`; })()}</p>
        </div>
      </div>
      
      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-4">D0: {state.language === 'es' ? 'CONFIGURACIÓN' : 'CONFIGURATION'}</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseType')}</label>
            <p className="font-bold text-sm">{state.setup.type}</p>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('impacts')} / {t('standards')}</label>
            <p className="font-bold text-sm">
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

      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-4">{t('d1d2')}</h2>
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-100">
            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">{t('phenomenology')}</label>
            <p className="text-sm italic">"{state.d2.phenomenon}"</p>
          </div>
          {state.d2.fiveW2H && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(state.d2.fiveW2H).map(([k, v]) => (
                <div key={k} className="p-3 bg-slate-50 rounded-lg">
                  <label className="text-[9px] font-black text-slate-400 uppercase block border-b border-slate-100 mb-1">{t(k) || k}</label>
                  <p className="text-[11px] font-bold text-slate-700">{String(v)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d3')}</h2>
        <div className="space-y-6">
          {state.d3.isNotApplicable ? (
            <div className="p-6 text-center text-sm font-bold text-slate-500 uppercase tracking-wide bg-slate-50 border border-slate-200 rounded-2xl">
              {state.language === 'es' ? 'No aplica para este caso' : 'Not applicable for this case'}
            </div>
          ) : state.d3.selectedCorrectiveActionIds.length > 0 ? (
            state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id)).map((action) => (
              <div key={action.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('actionSelected')}</h3>
                <p className="text-sm font-bold text-slate-800 mb-4 italic">
                  "{action.action}"
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('responsible')}</label>
                    <p className="text-xs font-bold text-slate-700">{action.responsible}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{t('implementationDate')}</label>
                    <p className="text-xs font-bold text-slate-700">{action.implementationDate}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center opacity-30 italic text-sm">
              {t('waitingAnalysis')}
            </div>
          )}
        </div>
      </div>

      <div className="industrial-card">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d4')}</h2>
        <div className="space-y-8">
          <div>
            <h3 className="text-sm font-black text-blue-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <QueueListIcon className="w-4 h-4"/> {t('ishikawaSummary')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {mCategories.map(cat => {
                const fixed = state.d4.hypotheses.filter(h => h.category === cat && state.d4.selectedHypotheses.includes(h.id));
                if (fixed.length === 0) return null;
                return (
                  <div key={cat} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <label className="text-[9px] font-black text-slate-400 uppercase border-b border-slate-100 block mb-2">{cat}</label>
                    <ul className="list-disc pl-4 text-[11px] font-bold text-slate-600 space-y-1">
                      {fixed.map(h => <li key={h.id}>{h.text}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-slate-50 text-slate-900 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-4">{t('systemicRoot')} (5 Whys)</h4>
            <div className="space-y-6">
              {state.d4.fiveWhysHistory.map((h) => (
                <div key={h.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex gap-3 mb-4">
                    <span className="text-blue-600 font-black uppercase text-xs">Raíz:</span>
                    <span className="text-sm font-bold uppercase tracking-tight">{h.systemicRootCause}</span>
                  </div>
                  <div className="space-y-2 pl-4 border-l-2 border-slate-100">
                    {h.whys.map((w, idx) => (
                      <div key={idx} className="text-[11px]">
                        <span className="text-slate-400 font-black mr-2">{idx + 1}.</span>
                        <span className="text-slate-500 italic mr-2">{w.step}</span>
                        <span className="text-slate-800 font-bold">{w.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="industrial-card page-break">
        <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('d5')}</h2>
        <div className="space-y-8">
          {state.d5_d6.acpPlans.map((plan, pIdx) => (
            <div key={pIdx} className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${plan.type === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {plan.type === 'primary' ? t('primary') : t('secondary')}
                </span>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{plan.rootCause}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {plan.actions.filter(a => a.isFixed).map((a, aIdx) => (
                  <div key={aIdx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-grow">
                        <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                          {a.actionId ? `ACCION ${a.actionId}` : 'Acción'}
                        </label>
                        <p className="text-xs font-bold text-slate-800">{a.action}</p>
                      </div>
                      <div className="text-right">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo</label>
                        <span className="text-[9px] font-black text-slate-600 uppercase">{a.type || 'ACP'}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{state.language === 'es' ? '¿Cuál será la evidencia de la implementación?' : 'Implementation Evidence'}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.evidenceHow}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{state.language === 'es' ? '¿Cómo se verificará la implementación?' : 'Implementation Verification'}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.verificationHow}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('implementationDate')}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.timeframe}</p>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
                        <p className="text-[10px] font-bold text-slate-600">{a.responsible}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale"><div className="flex items-center gap-2"><BuildingOffice2Icon className="w-5 h-5"/><span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span></div><p className="text-[9px] font-bold uppercase">{t('scientificMethod')}</p></div>
    </div>
  );
};
