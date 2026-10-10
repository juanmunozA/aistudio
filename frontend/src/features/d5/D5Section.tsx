import { useEffect } from 'react';
import { Tab, type AppState, type ACPPlan, type ActionStep } from '../../types';
import { WrenchScrewdriverIcon, ArrowPathIcon, DocumentTextIcon, QuestionMarkCircleIcon, CloudArrowDownIcon, PlusCircleIcon, CheckBadgeIcon as CheckBadgeIconSolid, BoltIcon, ArrowRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { INITIAL_STATE } from '../../shared/constants/initialState';

export const D5Section = ({ state, setState, runAi, loading, setActiveTab, t, setBanner }: any) => {
  const setD5Step = (s: number) => setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, step: s } }));

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d5_d6: INITIAL_STATE.d5_d6
    }));
  };

  const generateACP = (evt?: any) => {
    const isManualClick = evt !== undefined;
    const d4 = state.d4 || INITIAL_STATE.d4;
    const fixedIds = [...(d4.fixedRootCauseIds || [])];

    if (fixedIds.length === 0) {
      if (isManualClick) {
        alert(state.language === 'es' ? 'Debe fijar al menos una causa raíz en el paso D4.' : 'You must fix at least one root cause in step D4.');
      }
      return;
    }

    // Check if any fixed root causes don't have actions in d4.secondaryActions
    const missingActions = fixedIds.filter(id => {
      const actions = d4.secondaryActions?.[id] || [];
      return actions.length === 0;
    });

    if (missingActions.length > 0 && isManualClick) {
      const causes = fixedIds.map(id => {
        if (id.startsWith('synth-')) return { id, text: d4.syntheticCause?.text || "" };
        const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
        return { id, text: analysis?.systemicRootCause || "" };
      });

      runAi('d5Secondary', 'd4Secondary', { phenomenon: state.d2.phenomenon, causes }, (data: any) => {
        const actionMap: Record<string, ActionStep[]> = { ...(d4.secondaryActions || {}) };
        const results = data?.results || [];
        results.forEach((r: any) => { 
          if (r && r.hypothesisId) { 
            const matchingId = fixedIds.find(fid => String(fid) === String(r.hypothesisId));
            if (matchingId) { 
              const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              actionMap[matchingId] = (r.actions || []).map((act: string, idx: number) => ({ 
                id: `action-${matchingId}-${idx}-${Date.now()}`,
                action: act, 
                evidenceHow: "",
                evidenceDate: defaultDate,
                evidenceResponsible: state.language === 'es' ? "Líder de Área" : "Area Leader",
                verificationHow: "",
                responsible: state.language === 'es' ? "Líder de Área" : "Area Leader", 
                timeframe: defaultDate, 
                isFixed: false 
              })); 
            } 
          } 
        });

        const newPlans: ACPPlan[] = [];
        const caseNumberMatch = state.setup.caseName.match(/^\d+/);
        const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";
        const isAudit = state.setup.type === 'Hallazgo de Auditoría, ACPM';
        let globalActionCounter = 1;

        fixedIds.forEach((id) => {
          const actions = actionMap[id] || [];
          if (actions.length > 0) {
            let rootText = "";
            if (id.startsWith('synth-')) {
              rootText = d4.syntheticCause?.text || "";
            } else {
              const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
              rootText = analysis?.systemicRootCause || "";
            }

            newPlans.push({
              id: `acp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              rootCause: rootText,
              title: state.language === 'es' ? `Plan ACP: ${rootText.substring(0, 40)}...` : `PCA Plan: ${rootText.substring(0, 40)}...`,
              introduction: state.language === 'es' ? `Acciones para mitigación de falla.` : `Actions for failure mitigation.`,
              actions: actions.map((a, idx) => ({ 
                ...a, 
                id: a.id || `action-${id}-${idx}-${Date.now()}`,
                actionId: isAudit && caseNumber ? `${caseNumber}-${globalActionCounter++}` : undefined,
                evidenceHow: a.evidenceHow || "",
                evidenceDate: a.evidenceDate || (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
                evidenceResponsible: a.evidenceResponsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
                verificationHow: a.verificationHow || "",
                isFixed: a.isFixed || false 
              })),
              type: id === d4.primaryCauseId ? 'primary' : 'secondary'
            });
          }
        });

        setState((p: any) => ({
          ...p,
          d4: { ...p.d4, secondaryActions: actionMap },
          d5_d6: { ...(p.d5_d6 || {}), acpPlans: newPlans }
        }));
        alert(t('actionsMaterialized'));
      });
      return;
    }

    // Offline mapping from existing actions
    const newPlans: ACPPlan[] = [];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";
    const isAudit = state.setup.type === 'Hallazgo de Auditoría, ACPM';
    let globalActionCounter = 1;

    fixedIds.forEach((id) => {
      const secondaryActions = d4.secondaryActions || {};
      const actions = secondaryActions[id] || [];
      if (actions.length > 0) {
        let rootText = "";
        if (id.startsWith('synth-')) {
          rootText = d4.syntheticCause?.text || "";
        } else {
          const analysis = d4.fiveWhysHistory?.find(a => a.id === id);
          rootText = analysis?.systemicRootCause || "";
        }

        newPlans.push({
          id: `acp-${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rootCause: rootText,
          title: state.language === 'es' ? `Plan ACP: ${rootText.substring(0, 40)}...` : `PCA Plan: ${rootText.substring(0, 40)}...`,
          introduction: state.language === 'es' ? `Acciones para mitigación de falla.` : `Actions for failure mitigation.`,
          actions: actions.map((a, idx) => ({ 
            ...a, 
            id: a.id || `action-${id}-${idx}-${Date.now()}`,
            actionId: isAudit && caseNumber ? `${caseNumber}-${globalActionCounter++}` : undefined,
            evidenceHow: a.evidenceHow || "",
            evidenceDate: a.evidenceDate || (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })(),
            evidenceResponsible: a.evidenceResponsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            verificationHow: a.verificationHow || "",
            isFixed: a.isFixed || false 
          })),
          type: id === d4.primaryCauseId ? 'primary' : 'secondary'
        });
      }
    });

    setState((p: any) => ({
      ...p,
      d5_d6: { ...(p.d5_d6 || {}), acpPlans: newPlans }
    }));

    if (isManualClick) {
      if (newPlans.length > 0) {
        alert(t('actionsMaterialized'));
      } else {
        alert(state.language === 'es' ? 'No se encontraron acciones en D4. Por favor genere las acciones en el paso D4 o verifique que existan causas fijadas.' : 'No actions found in D4. Please generate actions in step D4 or verify that fixed causes exist.');
      }
    }
  };

  const refreshImprovementActions = () => {
    if (state.setup.type !== 'Oportunidad de mejora') return;
    const phenomenonText = state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName;
    if (!phenomenonText || phenomenonText.trim() === '') {
      alert(state.language === 'es' ? 'No se encontró la descripción del fenómeno u oportunidad de mejora.' : 'No phenomenon or improvement opportunity description found.');
      return;
    }

    const currentPlans = state.d5_d6.acpPlans || [];
    if (currentPlans.length === 0) {
      alert(state.language === 'es' ? 'No hay un plan de acciones generado actualmente.' : 'There is currently no generated action plan.');
      return;
    }

    const primaryPlanIndex = currentPlans.findIndex((p: ACPPlan) => p.type === 'primary') !== -1 
      ? currentPlans.findIndex((p: ACPPlan) => p.type === 'primary') 
      : 0;
    const targetPlan = currentPlans[primaryPlanIndex];
    const existingActions: ActionStep[] = targetPlan.actions || [];

    const fixedActions = existingActions.filter(a => a.isFixed);
    const unfixedCount = Math.max(1, 4 - fixedActions.length);

    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";

    runAi(
      'd5RefreshImprovement',
      'd5RefreshImprovement',
      { phenomenonText, existingActions: existingActions.map(a => a.action), count: unfixedCount },
      (data: any) => {
        let actionList: string[] = [];
        if (data?.results?.[0]?.actions && Array.isArray(data.results[0].actions)) {
          actionList = data.results[0].actions;
        } else if (Array.isArray(data?.actions)) {
          actionList = data.actions;
        } else if (data?.results && Array.isArray(data.results)) {
          actionList = data.results.flatMap((r: any) => r.actions || []);
        }

        if (!actionList || actionList.length === 0) {
          actionList = [
            state.language === 'es' ? "Implementar auditorías aleatorias en Gemba para asegurar adherencia al estándar" : "Implement random Gemba audits to ensure standard adherence",
            state.language === 'es' ? "Diseñar e instalar ayudas visuales Poka-Yoke en la estación de trabajo" : "Design and install visual Poka-Yoke aids at the workstation",
            state.language === 'es' ? "Revisar y actualizar la matriz de competencias y matriz de riesgos del área" : "Review and update area competency and risk matrix",
            state.language === 'es' ? "Establecer indicador de gestión semanal para medir el desempeño del proceso" : "Establish weekly management indicator to measure process performance"
          ];
        }

        const newFormattedActions: ActionStep[] = actionList.slice(0, unfixedCount).map((actText: any, idx: number) => {
          const act = typeof actText === 'string' ? actText : (actText?.action || actText?.text || String(actText));
          const actionIdx = fixedActions.length + idx + 1;
          return {
            id: `action-improvement-refresh-${idx}-${Date.now()}`,
            actionId: caseNumber ? `${caseNumber}-${actionIdx}` : `${actionIdx}`,
            action: act,
            evidenceHow: state.language === 'es' ? "Documento o Registro de implementación del estándar" : "Standard implementation document or record",
            evidenceDate: defaultDate,
            evidenceResponsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            verificationHow: state.language === 'es' ? "Auditoría en Gemba y seguimiento a KPI" : "Gemba audit and KPI follow-up",
            responsible: state.setup.responsible || (state.language === 'es' ? "Líder de Área" : "Area Leader"),
            timeframe: defaultDate,
            isFixed: false
          };
        });

        const finalActions: ActionStep[] = [];
        let newIdx = 0;
        existingActions.forEach((a) => {
          if (a.isFixed) {
            finalActions.push(a);
          } else if (newIdx < newFormattedActions.length) {
            finalActions.push(newFormattedActions[newIdx++]);
          }
        });

        while (newIdx < newFormattedActions.length) {
          finalActions.push(newFormattedActions[newIdx++]);
        }

        const nextPlans = [...currentPlans];
        nextPlans[primaryPlanIndex] = {
          ...targetPlan,
          actions: finalActions
        };

        setState((p: AppState) => ({
          ...p,
          d5_d6: {
            ...(p.d5_d6 || {}),
            acpPlans: nextPlans
          }
        }));
      }
    );
  };

  const generateImplementationGuide = (action: ActionStep) => {
    runAi(`d5Impl-${action.id}`, 'd5Implementation', { action: action.action, responsible: action.responsible, timeframe: action.timeframe }, (data) => {
      setState((p: AppState) => ({
        ...p,
        d5_d6: {
          ...p.d5_d6,
          implementationSuggestions: {
            ...(p.d5_d6.implementationSuggestions || {}),
            [action.id]: data
          }
        }
      }));
    });
  };

  useEffect(() => {
    if ((!state.d5_d6.acpPlans || state.d5_d6.acpPlans.length === 0) && state.d4.secondaryActions && Object.keys(state.d4.secondaryActions).length > 0) {
      generateACP();
    }
  }, []);

  const exportACPToCSV = () => {
    if (!state.d5_d6.acpPlans || state.d5_d6.acpPlans.length === 0) return alert(t('waitingAnalysis'));
    const data: any[][] = [
      ["PLAN DE ACCIONES CORRECTIVAS PERMANENTES (ACP)"],
      ["Caso:", state.setup.caseName],
      [],
      ["TIPO", "TITULO", "CAUSA_RAIZ", "ID_ACCION", "ACCION", "EVIDENCIA_IMPLEMENTACION", "VERIFICACION_IMPLEMENTACION", "FECHA", "RESPONSABLE", "ESTADO"]
    ];
    state.d5_d6.acpPlans.forEach(plan => {
      plan.actions.forEach(action => {
        data.push([
          plan.type,
          plan.title,
          plan.rootCause,
          action.actionId || '',
          action.action,
          action.evidenceHow || '',
          action.verificationHow || '',
          action.timeframe,
          action.responsible,
          action.isFixed ? 'FIXED' : 'PENDING'
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan ACP");
    ws['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
    XLSX.writeFile(wb, `Plan_ACP_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  const fixedActions = (state.d5_d6.acpPlans || []).flatMap((p: ACPPlan) => p.actions || []).filter(a => a.isFixed);

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <WrenchScrewdriverIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d5')}</h2>
              <button onClick={() => setBanner({ title: t('d5'), content: t('d5Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('eliminateRoot')}
              <button onClick={() => setBanner({ title: t('eliminateRoot'), content: t('d5Banner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        {[1, 2].map(s => (
          <button 
            key={s} 
            onClick={() => setD5Step(s)} 
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-[0.98] ${state.d5_d6.step === s ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}
          >
            {s === 1 ? (state.language === 'es' ? '1. Generar Plan' : '1. Generate Plan') : (state.language === 'es' ? '2. Implementación Plan' : '2. Implementation Plan')}
          </button>
        ))}
      </div>

      {state.d5_d6.step === 1 && (
        <div className="space-y-10">
          <div className="flex flex-wrap justify-end gap-4">
            {state.setup.type === 'Oportunidad de mejora' && (
              <button 
                onClick={refreshImprovementActions} 
                disabled={loading === 'd5RefreshImprovement'}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all flex items-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowPathIcon className="w-4 h-4" /> 
                {loading === 'd5RefreshImprovement' 
                  ? '...' 
                  : (state.language === 'es' ? 'Refrescar / Generar Acciones No Fijadas' : 'Refresh / Generate Unfixed Actions')}
              </button>
            )}
            <button 
              onClick={() => generateACP(true)} 
              className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
            >
              <ArrowPathIcon className="w-4 h-4" /> {state.language === 'es' ? 'Actualizar Acciones' : 'Update Actions'}
            </button>
            <button onClick={exportACPToCSV} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2">
              <CloudArrowDownIcon className="w-4 h-4" /> {t('downloadACP')}
            </button>
          </div>
          
          <div className="space-y-12">
            {(state.d5_d6.acpPlans || []).map((plan: ACPPlan, pIdx: number) => (
              <div key={plan.id} className={`industrial-card rounded-[2.5rem] p-10 bg-white border-2 transition-all relative ${plan.type === 'primary' ? 'border-blue-600 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-8 pr-16">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${plan.type === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {plan.type === 'primary' ? t('primary') : t('secondary')}
                      </div>
                      <div className="h-px bg-slate-100 flex-grow"></div>
                    </div>
                    
                    <AutoExpandingTextarea 
                      value={plan.title} 
                      onChange={(e: any) => { 
                        const nextPlans = [...state.d5_d6.acpPlans]; 
                        nextPlans[pIdx].title = e.target.value; 
                        setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                      }} 
                      className="bg-transparent text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight outline-none w-full border-none p-0 focus:ring-0" 
                    />

                    <div className="p-6 bg-slate-50/80 rounded-[2rem] border border-slate-100/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-3 bg-blue-600 rounded-full"></div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          {state.language === 'es' ? 'Causa Raíz Asociada' : 'Associated Root Cause'}
                        </label>
                        <button onClick={() => setBanner({ title: state.language === 'es' ? 'Causa Raíz Asociada' : 'Associated Root Cause', content: t('d5RootCauseBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,0.8)]">
                          <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                        </button>
                      </div>
                      <AutoExpandingTextarea 
                        value={plan.rootCause} 
                        onChange={(e: any) => { 
                          const nextPlans = [...state.d5_d6.acpPlans]; 
                          nextPlans[pIdx].rootCause = e.target.value; 
                          setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                        }} 
                        className="bg-transparent text-sm font-bold text-slate-700 leading-relaxed outline-none w-full border-none p-0 focus:ring-0" 
                      />
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100 shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.language === 'es' ? 'ID Acción' : 'Action ID'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{t('action')}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{state.language === 'es' ? '¿Cuál será la evidencia de la implementación?' : 'What will be the implementation evidence?'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-1/4">{state.language === 'es' ? '¿Cómo se verificará la implementación?' : 'How will the implementation be verified?'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{state.language === 'es' ? 'Fecha impl.' : 'Impl. date'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest w-[220px] min-w-[220px]">{state.language === 'es' ? 'Resp. impl.' : 'Impl. resp.'}</th>
                        <th className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center">{t('fix')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {(plan.actions || []).map((action: ActionStep, aIdx: number) => (
                        <tr key={aIdx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-[10px] font-black text-slate-400 mono">
                            <input 
                              type="text" 
                              value={action.actionId || ''} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].actionId = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-black text-slate-700 mono outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="ID"
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.action} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].action = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.evidenceHow || ''} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].evidenceHow = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="..."
                            />
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <AutoExpandingTextarea 
                              value={action.verificationHow || ''} 
                              onChange={(e: any) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].verificationHow = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[11px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0" 
                              placeholder="..."
                            />
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500">
                            <input 
                              type="date" 
                              value={action.timeframe} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].timeframe = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full border-none p-0 focus:ring-0 cursor-pointer" 
                            />
                          </td>
                          <td className="p-4 text-xs font-bold text-slate-500 w-[220px] min-w-[220px]">
                            <input 
                              type="text" 
                              value={action.responsible} 
                              onChange={(e) => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].responsible = e.target.value; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-full border-none p-0 focus:ring-0" 
                            />
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => { 
                                const nextPlans = [...state.d5_d6.acpPlans]; 
                                nextPlans[pIdx].actions[aIdx].isFixed = !action.isFixed; 
                                setState((p: any) => ({ ...p, d5_d6: { ...p.d5_d6, acpPlans: nextPlans } })); 
                              }} 
                              className={`p-2 rounded-lg transition-all ${action.isFixed ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-300 hover:text-blue-600'}`}
                            >
                              {action.isFixed ? <CheckBadgeIconSolid className="w-5 h-5" /> : <PlusCircleIcon className="w-5 h-5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
          
          {fixedActions.length > 0 && (
            <div className="flex justify-center mt-12">
              <button 
                onClick={() => setD5Step(2)} 
                className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-[0.95]"
              >
                {state.language === 'es' ? 'Ir a Implementación Plan' : 'Go to Implementation Plan'} <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {state.d5_d6.step === 2 && (
        <div className="space-y-10 animate-slide-in">
          {fixedActions.length === 0 ? (
            <div className="industrial-card rounded-[2.5rem] p-20 text-center bg-white border border-slate-200 opacity-50">
              <ExclamationCircleIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {state.language === 'es' ? 'Fija al menos una acción en el paso 1 para generar su guía de implementación.' : 'Fix at least one action in step 1 to generate its implementation guide.'}
              </p>
              <button onClick={() => setD5Step(1)} className="mt-6 px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest">
                {state.language === 'es' ? 'Volver al Paso 1' : 'Back to Step 1'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {fixedActions.map((action: ActionStep) => {
                const suggestion = state.d5_d6.implementationSuggestions?.[action.id];
                const isGenerating = loading?.includes(`d5Impl-${action.id}`);
                
                return (
                  <div key={action.id} className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                          <BoltIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{action.action}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t('responsible')}: {action.responsible} | {t('implementationDate')}: {action.timeframe}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => generateImplementationGuide(action)}
                        disabled={isGenerating}
                        className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                      >
                        {isGenerating ? '...' : (suggestion ? (state.language === 'es' ? 'Regenerar Guía' : 'Regenerate Guide') : (state.language === 'es' ? 'Generar Guía' : 'Generate Guide'))}
                      </button>
                    </div>
                    
                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[200px] h-auto flex flex-col">
                      {suggestion ? (
                        <AutoExpandingTextarea 
                          value={suggestion} 
                          onChange={(e: any) => {
                            setState((p: AppState) => ({
                              ...p,
                              d5_d6: {
                                ...p.d5_d6,
                                implementationSuggestions: {
                                  ...(p.d5_d6.implementationSuggestions || {}),
                                  [action.id]: e.target.value
                                }
                              }
                            }));
                          }}
                          className="bg-transparent text-sm font-medium text-slate-700 leading-relaxed outline-none w-full border-none p-0 focus:ring-0" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50 py-10">
                          <DocumentTextIcon className="w-12 h-12" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('waitingAnalysis')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end mt-12">
            <button 
              onClick={() => setActiveTab(Tab.D6)} 
              className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]"
            >
              {state.language === 'es' ? 'Avanzar a POKA-YOKE' : 'Advance to POKA-YOKE'} <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
