import { useState } from 'react';
import { Tab, type AppState } from '../../types';
import { ShieldCheckIcon, CheckCircleIcon, QuestionMarkCircleIcon, RocketLaunchIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { INITIAL_STATE } from '../../shared/constants/initialState';
import { caseActions, useCaseState } from '../../store/caseStore';
import type { SectionProps } from '../sectionProps';
import { useAiRunner } from '../ai/useAiRunner';

export const D3Section = ({ setActiveTab, t, setBanner }: SectionProps) => {
  const state = useCaseState();
  const { runAi, loading } = useAiRunner();
  const handleResetSection = () => {
    caseActions.updateSection('d3', (current) => INITIAL_STATE.d3);
  };

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');

  const handleGenerateActions = () => {
    const selectedActions = (state.d3.correctiveActions || []).filter((a) => (state.d3.selectedCorrectiveActionIds || []).includes(a.id));
    runAi<Partial<AppState['d3']>>('d3', 'd3', { caseName: state.setup.caseName, phenomenon: state.d2.phenomenon, selectedActions }, (result) => {
      caseActions.updateSection('d3', (current) => ({ ...current, ...result }));
    });
  };

  const handleGenerateImplementation = () => {
    const selectedActions = state.d3.correctiveActions.filter((a: any) => state.d3.selectedCorrectiveActionIds.includes(a.id));
    if (selectedActions.length === 0) return;

    runAi(
      'd3Impl',
      'd3Implementation',
      { actions: selectedActions.map(a => ({ action: a.action, responsible: a.responsible, implementationDate: a.implementationDate })) },
      (result: Partial<AppState['d3']>) => {
        caseActions.updateSection('d3', (current) => ({ ...current, ...result }));
        setViewMode('preview');
      }
    );
  };

  const selectedActions = state.d3.correctiveActions.filter((a: any) => state.d3.selectedCorrectiveActionIds.includes(a.id));

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ShieldCheckIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d3')}</h2>
              <button onClick={() => setBanner({ title: t('d3'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('correctiveActionSub')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 border-b border-slate-100 pb-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              {t('correctiveActionTitle')}
              <button onClick={() => setBanner({ title: t('correctiveActionTitle'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              {t('immediateActionsToContainTheProblem')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Opción "No Aplica" */}
            <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-4 py-2 transition-all select-none">
              <input 
                type="checkbox" 
                checked={!!state.d3.isNotApplicable} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  caseActions.updateSection('d3', (current) => ({
                      ...current,
                      isNotApplicable: checked,
                      selectedCorrectiveActionIds: checked ? [] : current.selectedCorrectiveActionIds,
                      implementationPlan: checked ? "No aplica para este caso" : current.implementationPlan
                    }));
                }}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                {t('notApplicable')}
              </span>
            </label>

            {!state.d3.isNotApplicable && (
              <button
                onClick={handleGenerateActions}
                disabled={loading === 'd3'}
                className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-[0.95] disabled:opacity-50"
              >
                {loading === 'd3' ? '...' : t('createProtocol')}
              </button>
            )}
          </div>
        </div>

        {state.d3.isNotApplicable ? (
          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-slate-200 border-dashed">
            <ShieldCheckIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t('stepD3CorrectionHasBeenMarked')}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
              {t('noTechnicalContainmentInfoWillBe')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {state.d3.correctiveActions.map((action: any) => (
            <div
              key={action.id}
              onClick={() => caseActions.updateCase((p: any) => {
                const currentIds = p.d3.selectedCorrectiveActionIds || [];
                const nextIds = currentIds.includes(action.id)
                  ? currentIds.filter((id: string) => id !== action.id)
                  : [...currentIds, action.id];
                return { ...p, d3: { ...p.d3, selectedCorrectiveActionIds: nextIds } };
              })}
              className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col h-auto ${
                state.d3.selectedCorrectiveActionIds.includes(action.id)
                  ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-100 bg-white hover:border-blue-200'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${state.d3.selectedCorrectiveActionIds.includes(action.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <CheckCircleIcon className="w-5 h-5" />
                </div>
                {state.d3.selectedCorrectiveActionIds.includes(action.id) && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg shadow-sm">{t('selected')}</span>
                )}
              </div>
              <AutoExpandingTextarea
                value={action.action}
                onChange={(e: any) => {
                  const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, action: e.target.value } : a);
                  caseActions.updateSection('d3', (current) => ({ ...current, correctiveActions: nextActions }));
                }}
                onClick={(e: any) => e.stopPropagation()}
                className="bg-transparent text-sm font-bold text-slate-700 leading-relaxed outline-none focus:ring-1 focus:ring-blue-100 rounded p-1"
              />
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('responsible')}</label>
                  <input
                    type="text"
                    value={action.responsible}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, responsible: e.target.value } : a);
                      caseActions.updateSection('d3', (current) => ({ ...current, correctiveActions: nextActions }));
                    }}
                    className="w-full bg-white/50 border border-slate-200 rounded-lg p-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('implementationDate')}</label>
                  <input
                    type="date"
                    value={action.implementationDate}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const nextActions = state.d3.correctiveActions.map((a: any) => a.id === action.id ? { ...a, implementationDate: e.target.value } : a);
                      caseActions.updateSection('d3', (current) => ({ ...current, correctiveActions: nextActions }));
                    }}
                    className="w-full bg-white/50 border border-slate-200 rounded-lg p-2 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedActions.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
            <button
              onClick={handleGenerateImplementation}
              disabled={loading === 'd3Impl'}
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95] disabled:opacity-50"
            >
              {loading === 'd3Impl' ? '...' : t('generateImplementationPlan')}
              <RocketLaunchIcon className="w-5 h-5" />
            </button>
          </div>
        )}
          </>
        )}
      </div>

      {!state.d3.isNotApplicable && state.d3.implementationPlan && (
        <div className="industrial-card rounded-[2rem] overflow-hidden flex flex-col h-auto">
          <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                {t('implementationPlan')}
                <button onClick={() => setBanner({ title: t('implementationPlan'), content: t('d3Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                  <QuestionMarkCircleIcon className="w-7 h-7" />
                </button>
              </h3>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button>
                <button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button>
              </div>
            </div>
          </div>
          <div className="p-10 h-auto flex flex-col">
            {viewMode === 'edit' ? (
              <AutoExpandingTextarea
                value={state.d3.implementationPlan}
                onChange={(e: any) => caseActions.updateSection('d3', (current) => ({ ...current, implementationPlan: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-sm font-medium mono focus:ring-0 outline-none transition-all leading-relaxed"
              />
            ) : (
              <div className="official-document p-12 rounded-[2rem] border border-slate-200 bg-white relative animate-scale-up h-auto flex flex-col">
                <div className="relative z-10 h-auto">{renderStyledMarkdown(state.d3.implementationPlan)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón inferior para Avanzar a D4 */}
      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
        <button 
          onClick={() => setActiveTab(Tab.D4)} 
          className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]"
        >
          {t('advanceToD4RootCause')}
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
