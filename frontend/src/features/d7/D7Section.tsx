import { useState } from 'react';
import { type AppState, type ActionStep, type A3ReportData, type EfficacyStep } from '../../types';
import { QuestionMarkCircleIcon, CheckBadgeIcon, PrinterIcon, CheckIcon } from '@heroicons/react/24/outline';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { handleDownloadPDF } from '../../shared/utils/print';
import { caseActions, useCaseState } from '../../store/caseStore';
import type { SectionProps } from '../sectionProps';
import { useAiRunner } from '../ai/useAiRunner';

export const D7Section = ({ t, setBanner }: SectionProps) => {
  const state = useCaseState();
  const { runAi, loading } = useAiRunner();
  const handleResetSection = () => {
    caseActions.resetSection('d7');
  };

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');

  const generateA3 = () => {
    const history = state.d4.fiveWhysHistory || [];
    const d3Selected = state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id));

    runAi('d5A3', 'd5A3', {
      phenomenon: state.d2.phenomenon,
      totalLoss: state.costs.totalLoss,
      risks: state.d2.analysis,
      rootCauses: history.map(h => h.systemicRootCause),
      d3: {
        isNotApplicable: !!state.d3.isNotApplicable,
        selectedActions: d3Selected.map(a => ({ action: a.action, responsible: a.responsible, implementationDate: a.implementationDate })),
      },
      acpPlans: state.d5_d6.acpPlans || [],
      pokaYokes: (state.d5_d6.pokaYokes || []).map(p => ({ description: p.description, level: p.level, isConfirmed: p.isConfirmed })),
      poe: state.d8.poe,
      yokoTen: state.d8.yokoTen,
      efficacyProtocols: state.efficacy.protocols.map(p => ({
        id: p.id,
        action: p.action,
        verificationMethod: p.verificationMethod,
        verificationResponsible: p.verificationResponsible,
        verificationDate: p.verificationDate,
        isEffective: p.isEffective,
      })),
      responsible: state.setup.responsible,
      generatedOn: new Date().toLocaleDateString(),
    }, (result: AppState['d7']) => caseActions.updateSection('d7', () => result));
  };

  const updateA3Field = <K extends keyof A3ReportData>(field: K, val: A3ReportData[K]) => {
    caseActions.updateCase((p: AppState) => {
      if (!p.d7.a3Report) return p;
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, [field]: val } } };
    });
  };

  const updateA3Action = (idx: number, val: string) => {
    caseActions.updateCase((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.actions) return p;
      const nextActions = [...p.d7.a3Report.actions];
      nextActions[idx] = { ...nextActions[idx], action: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, actions: nextActions } } };
    });
  };

  const updateA3ActionDate = (idx: number, val: string) => {
    caseActions.updateCase((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.actions) return p;
      const nextActions = [...p.d7.a3Report.actions];
      nextActions[idx] = { ...nextActions[idx], timeframe: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, actions: nextActions } } };
    });
  };

  const updateEfficacyStepField = (idx: number, field: keyof EfficacyStep, val: string) => {
    caseActions.updateCase((p: AppState) => {
      if (!p.d7.a3Report || !p.d7.a3Report.efficacySteps) return p;
      const nextSteps = [...p.d7.a3Report.efficacySteps];
      nextSteps[idx] = { ...nextSteps[idx], [field]: val };
      return { ...p, d7: { ...p.d7, a3Report: { ...p.d7.a3Report, efficacySteps: nextSteps } } };
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <CheckBadgeIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d8')}</h2>
              <button onClick={() => setBanner({ title: t('d8'), content: t('d8Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('genManagerial')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex justify-between items-center mb-8 gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button onClick={() => setViewMode('edit')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'edit' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('edit')}</button>
          <button onClick={() => setViewMode('preview')} className={`px-5 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewMode === 'preview' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t('preview')}</button>
        </div>
        <div className="flex gap-4">
          {state.d7.a3Report && <button onClick={() => handleDownloadPDF('a3-print-container', `Reporte_A3_${state.setup.caseName}`)} className="px-6 py-5 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-red-700 transition-all flex items-center gap-3 active:scale-[0.95]"><PrinterIcon className="w-5 h-5" /> PDF</button>}
          <button onClick={generateA3} disabled={loading === 'd5A3'} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3">{loading === 'd5A3' ? '...' : t('consolidateA3')}</button>
        </div>
      </div>
      <div id="a3-print-container" className="official-document p-16 rounded-[2.5rem] border border-slate-300 bg-white relative shadow-2xl animate-scale-up h-auto flex flex-col">
        {state.d7.a3Report ? (
          <div className="relative z-10 space-y-12 h-auto flex flex-col">
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  {t('execReportA3')}
                  <button onClick={() => setBanner({ title: t('execReportA3'), content: t('d8Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h1>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t('generationDate2')}:
                  </p>
                  {viewMode === 'edit' ? (
                    <input 
                      type="text" 
                      value={state.d7.a3Report.generationDate} 
                      onChange={(e) => updateA3Field('generationDate', e.target.value)}
                      className="text-[10px] font-black text-slate-600 uppercase bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase">{state.d7.a3Report.generationDate || new Date().toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase">{t('responsible')}:</p>
                  {viewMode === 'edit' ? (
                    <input 
                      type="text" 
                      value={state.d7.a3Report.responsible} 
                      onChange={(e) => updateA3Field('responsible', e.target.value)}
                      className="text-[10px] font-black text-slate-600 uppercase bg-slate-50 border border-slate-200 rounded px-2 py-0.5 outline-none text-right"
                    />
                  ) : (
                    <span className="text-[10px] font-black text-slate-600 uppercase">{state.d7.a3Report.responsible || state.setup.responsible}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-auto">
              {/* LEFT COLUMN: Analysis & Context */}
              <div className="space-y-8 h-auto flex flex-col">
                <div className={`p-8 bg-blue-50 border border-blue-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-blue-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">1. {t('defProblem')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.phenomenon} onChange={(e) => updateA3Field('phenomenon', e.target.value)} className="bg-white border border-blue-100 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-blue-200" />
                  ) : (
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{state.d7.a3Report.phenomenon}"</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className={`p-8 bg-amber-50 border border-amber-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-amber-300 ring-offset-2 shadow-inner' : ''}`}>
                    <h3 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-4">2. {t('financialJustTitle')}</h3>
                    {viewMode === 'edit' ? (
                      <AutoExpandingTextarea value={state.d7.a3Report.financialJustification} onChange={(e) => updateA3Field('financialJustification', e.target.value)} className="bg-white border border-amber-100 rounded-xl p-4 text-sm font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-amber-200" />
                    ) : (
                      <p className="text-sm font-bold text-slate-700 leading-relaxed">{state.d7.a3Report.financialJustification}</p>
                    )}
                  </div>
                  <div className={`p-8 bg-red-50 border border-red-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-red-300 ring-offset-2 shadow-inner' : ''}`}>
                    <h3 className="text-xs font-black text-red-900 uppercase tracking-widest mb-4">3. {t('riskEvalTitle')}</h3>
                    {viewMode === 'edit' ? (
                      <AutoExpandingTextarea value={state.d7.a3Report.risks} onChange={(e) => updateA3Field('risks', e.target.value)} className="bg-white border border-red-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-red-200" />
                    ) : (
                      <div className="text-sm text-slate-700 leading-relaxed">{renderStyledMarkdown(state.d7.a3Report.risks)}</div>
                    )}
                  </div>
                </div>

                <div className={`p-8 bg-emerald-50 border border-emerald-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-emerald-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-4">4. {t('finalCausesTitle')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.rootCauses} onChange={(e) => updateA3Field('rootCauses', e.target.value)} className="bg-white border border-emerald-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-emerald-200" />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{state.d7.a3Report.rootCauses}</p>
                  )}
                </div>

                <div className={`p-8 bg-indigo-50 border border-indigo-100 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-indigo-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4">6. {t('standardizationTitle')}</h3>
                  {viewMode === 'edit' ? (
                    <AutoExpandingTextarea value={state.d7.a3Report.standardization} onChange={(e) => updateA3Field('standardization', e.target.value)} className="bg-white border border-indigo-100 rounded-xl p-4 text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-indigo-200" />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed">{state.d7.a3Report.standardization}</p>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Execution & Verification */}
              <div className="space-y-8 h-auto flex flex-col">
                <div className={`p-8 bg-white border border-slate-200 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-slate-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">5. {t('actionsTitle')}</h3>
                  <div className="space-y-3">
                    {state.d7.a3Report.actions && state.d7.a3Report.actions.length > 0 ? (
                      state.d7.a3Report.actions.map((a: ActionStep, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-blue-100 text-blue-600"><CheckIcon className="w-3.5 h-3.5" /></div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white">{a.type || t('action')}</span>
                              <span className="text-[7px] font-black text-slate-600 uppercase bg-slate-200 px-1.5 py-0.5 rounded-full">{a.actionId || '-'}</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase">{a.responsible}</span>
                              <span className="text-[7px] font-bold text-emerald-600 uppercase ml-auto">
                                {viewMode === 'edit' ? (
                                  <input 
                                    type="text" 
                                    value={a.timeframe} 
                                    onChange={(e) => updateA3ActionDate(idx, e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-1 outline-none w-20"
                                  />
                                ) : (
                                  a.timeframe
                                )}
                              </span>
                            </div>
                            {viewMode === 'edit' ? (
                              <AutoExpandingTextarea value={a.action} onChange={(e) => updateA3Action(idx, e.target.value)} className="bg-transparent text-[11px] font-bold text-slate-600 outline-none w-full" />
                            ) : (
                              <span className="text-[11px] font-bold text-slate-600 leading-tight">{a.action}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : <p className="text-[11px] italic text-slate-400">{t('waitingAnalysis')}</p>}
                  </div>
                </div>

                <div className={`p-8 bg-slate-50 border border-slate-200 rounded-3xl h-auto flex flex-col transition-all ${viewMode === 'edit' ? 'ring-2 ring-slate-300 ring-offset-2 shadow-inner' : ''}`}>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">7. {t('efficacyVerification2')}</h3>
                  <div className="space-y-3">
                    {state.d7.a3Report.efficacySteps && state.d7.a3Report.efficacySteps.length > 0 ? (
                      state.d7.a3Report.efficacySteps.map((s: EfficacyStep, idx: number) => (
                        <div key={idx} className="flex gap-3 items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-emerald-100 text-emerald-600"><CheckBadgeIcon className="w-3.5 h-3.5" /></div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[7px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full">{s.actionId || '-'}</span>
                              <span className="text-[7px] font-bold text-slate-400 uppercase">{s.responsible}</span>
                              <span className="text-[7px] font-black text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded-full">{s.isEffective}</span>
                              <span className="text-[7px] font-bold text-blue-400 uppercase ml-auto">
                                {viewMode === 'edit' ? (
                                  <input 
                                    type="text" 
                                    value={s.date} 
                                    onChange={(e) => updateEfficacyStepField(idx, 'date', e.target.value)}
                                    className="bg-white border border-slate-200 rounded px-1 outline-none w-20 text-slate-600"
                                  />
                                ) : (
                                  s.date
                                )}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {viewMode === 'edit' ? (
                                <>
                                  <AutoExpandingTextarea value={s.action} onChange={(e) => updateEfficacyStepField(idx, 'action', e.target.value)} className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full" placeholder="Action" />
                                  <AutoExpandingTextarea value={s.method} onChange={(e) => updateEfficacyStepField(idx, 'method', e.target.value)} className="bg-transparent text-[9px] text-slate-400 outline-none w-full" placeholder="Method" />
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Eficaz:</span>
                                    <input 
                                      type="text" 
                                      value={s.isEffective} 
                                      onChange={(e) => updateEfficacyStepField(idx, 'isEffective', e.target.value)}
                                      className="bg-white border border-slate-200 rounded px-1 outline-none text-[8px] w-10 text-slate-600"
                                    />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-[10px] font-bold text-slate-600 leading-tight">{s.action}</p>
                                  <p className="text-[9px] text-slate-400 leading-tight italic">{s.method}</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : <p className="text-[11px] italic text-slate-500">{t('waitingAnalysis')}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-48 text-center opacity-30">
            <p className="text-sm font-black uppercase tracking-[0.4em]">{t('waitingAnalysis')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
