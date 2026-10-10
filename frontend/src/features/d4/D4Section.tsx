import React, { useState, useMemo } from 'react';
import { Tab, type AppState, type Hypothesis, type FiveWhysAnalysis, type ActionStep, type ObservationValue, type FiveWhyStep, type GembaDiagnostic } from '../../types';
import { ClipboardDocumentCheckIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, BeakerIcon, DocumentTextIcon, QuestionMarkCircleIcon, CloudArrowDownIcon, CheckBadgeIcon, PrinterIcon, CheckIcon, SparklesIcon, Square2StackIcon, CheckBadgeIcon as CheckBadgeIconSolid, StarIcon, BoltIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { mCategoriesLocal } from '../../shared/constants/catalogs';
import { INITIAL_STATE } from '../../shared/constants/initialState';
import { extractTextFromFile } from '../../shared/utils/files';
import { handleDownloadPDF } from '../../shared/utils/print';

export const D4Section = ({ state, setState, runAi, loading, setActiveTab, t, setBanner }: any) => {
  const mCategories = (mCategoriesLocal as any)[state.language] || mCategoriesLocal.es;
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [confirmedDeletes, setConfirmedDeletes] = useState<Record<string, boolean>>({});
  const [isExtractingGemba, setIsExtractingGemba] = useState(false);

  const handleGembaConclusionsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtractingGemba(true);
    let extractedText = "";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await extractTextFromFile(file);
      if (text) {
        extractedText += (extractedText ? '\n\n' : '') + text;
      }
    }

    if (extractedText) {
      setState((p: AppState) => ({
        ...p,
        d4: { 
          ...p.d4, 
          gembaConclusions: (p.d4.gembaConclusions ? p.d4.gembaConclusions + '\n\n' : '') + extractedText 
        }
      }));
    }

    setIsExtractingGemba(false);
    e.target.value = ''; // Reset file input
  };

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d4: INITIAL_STATE.d4
    }));
  };

  const handleDeleteConfirmedCause = (id: string) => {
    setState((p: AppState) => ({
      ...p,
      d4: {
        ...p.d4,
        experimentalConfirmedCauses: (p.d4.experimentalConfirmedCauses || []).filter(cid => cid !== id)
      }
    }));
  };

  const handleDeleteAllAnalyses = () => {
    setState((p: AppState) => ({
      ...p,
      d4: {
        ...p.d4,
        fiveWhysHistory: [],
        fixedRootCauseIds: [],
        secondaryActions: {}
      }
    }));
  };

  const handleDeleteAnalysis = (idToDelete: string) => {
    if (!idToDelete) return;
    setState((p: AppState) => {
      const nextHistory = (p.d4.fiveWhysHistory || []).filter(item => item.id !== idToDelete);
      const nextFixedIds = (p.d4.fixedRootCauseIds || []).filter(id => id !== idToDelete);
      const nextSecondaryActions = { ...(p.d4.secondaryActions || {}) };
      delete nextSecondaryActions[idToDelete];
      
      return {
        ...p,
        d4: {
          ...p.d4,
          fiveWhysHistory: nextHistory,
          fixedRootCauseIds: nextFixedIds,
          secondaryActions: nextSecondaryActions
        }
      };
    });
  };

  const setStep = (step: number) => {
    setState((p: any) => ({ ...p, d4: { ...p.d4, step } }));
    const container = document.getElementById('main-content-scroll');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const generateIshikawa = () => {
    const existingCauses = (state.d4.hypotheses || [])
      .filter((h: Hypothesis) => (state.d4.selectedHypotheses || []).includes(h.id))
      .map((h: Hypothesis) => ({ category: h.category, text: h.text }));

    runAi(
      'd4Ishikawa', 
      'd4Ishikawa', 
      { phenomenon: state.d2.phenomenon, existingCauses }, 
      (data) => {
        setState((p: any) => {
          const nextHypotheses: Hypothesis[] = [];
          const incomingHypotheses = (data as any)?.hypotheses || [];
          const currentD4 = p.d4 || INITIAL_STATE.d4;
          
          mCategories.forEach((cat: string) => {
            // Keep selected (fixed) hypotheses for this category
            const fixed = (currentD4.hypotheses || []).filter((h: Hypothesis) => 
              h.category === cat && (currentD4.selectedHypotheses || []).includes(h.id)
            );

            // Filter incoming hypotheses for this category
            const iaNew = incomingHypotheses
              .filter((nh: any) => nh && nh.category === cat)
              .map((nh: any, i: number) => ({ 
                id: `h-${Date.now()}-${cat.replace(/\s+/g, '')}-${i}`, 
                category: cat, 
                text: nh.text || "" 
              }));

            const merged = [...fixed];
            
            // Add new ones from AI if they are not duplicates and we have space (up to 4 total)
            for (const newItem of iaNew) {
              if (merged.length < 4) {
                const isDuplicate = merged.some(m => 
                  m.text.trim().toLowerCase() === newItem.text.trim().toLowerCase()
                );
                if (!isDuplicate) {
                  merged.push(newItem);
                }
              }
            }

            // Fill with placeholders if still less than 4
            while (merged.length < 4) {
              merged.push({ 
                id: `h-manual-${Date.now()}-${cat.replace(/\s+/g, '')}-${merged.length}`, 
                category: cat, 
                text: t('additionalPotentialCause') 
              });
            }
            
            nextHypotheses.push(...merged);
          });
          
          return { ...p, d4: { ...currentD4, hypotheses: nextHypotheses, step: 1 } };
        });
      }
    );
  };

  const confirmedGembaHypotheses = useMemo(() => {
    return (state.d4.gembaDiagnostics || []).filter((diag: GembaDiagnostic) => {
      const checks = state.d4.observationChecks[diag.hypothesisId] || [];
      const noCount = checks.filter(v => v === 'no').length;
      return checks.filter(v => v !== null).length > 0 && (noCount / (diag.questions?.length || 1)) >= 0.5;
    });
  }, [state.d4.gembaDiagnostics, state.d4.observationChecks]);

  const experimentallyConfirmedHypotheses = useMemo(() => {
    const experimentalIds = state.d4.experimentalConfirmedCauses || [];
    return confirmedGembaHypotheses.filter(h => experimentalIds.includes(h.hypothesisId));
  }, [confirmedGembaHypotheses, state.d4.experimentalConfirmedCauses]);

  const generateGemba = () => {
    if ((state.d4.selectedHypotheses || []).length === 0) return alert(t('selectHypAlert'));
    const selectedList = (state.d4.hypotheses || []).filter(h => (state.d4.selectedHypotheses || []).includes(h.id));
    runAi('d4Gemba', 'd4Gemba', { causes: selectedList.map(h => ({ id: h.id, text: h.text })) }, (data) => {
      const initialChecks: Record<string, ObservationValue[]> = { ...(state.d4.observationChecks || {}) };
      const incomingDiagnostics = (data as any)?.diagnostics || [];
      const diagnostics = incomingDiagnostics.map((d: any) => {
        const questions = d.questions || [];
        if (!initialChecks[d.hypothesisId]) { initialChecks[d.hypothesisId] = questions.map(() => null); }
        return { hypothesisId: d.hypothesisId || `diag-${Date.now()}`, cause: d.cause || "", questions: questions };
      });
      setState((p: any) => ({ ...p, d4: { ...p.d4, gembaDiagnostics: diagnostics, observationChecks: initialChecks, step: 2 } }));
    });
  };

  const downloadGembaCSV = () => {
    if (!state.d4.gembaDiagnostics || state.d4.gembaDiagnostics.length === 0) return alert(t('noChecklistAlert'));
    const data: any[][] = [
      ["CHECKLIST GEMBA - VALIDACIÓN EN PISO"],
      ["Caso:", state.setup.caseName],
      [],
      ["HIPOTESIS", "CATEGORIA", "PREGUNTA", "RESPUESTA AUDITADA"]
    ];
    state.d4.gembaDiagnostics.forEach(diag => {
      const originalHypothesis = state.d4.hypotheses.find(h => h.id === diag.hypothesisId);
      const checks = state.d4.observationChecks[diag.hypothesisId] || [];
      diag.questions.forEach((q, qIdx) => {
        const checkValue = checks[qIdx] === 'yes' ? 'SI' : checks[qIdx] === 'no' ? 'NO' : 'PENDIENTE';
        data.push([diag.cause, originalHypothesis?.category || 'N/A', q, checkValue]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gemba Checklist");
    ws['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 60 }, { wch: 20 }];
    XLSX.writeFile(wb, `Checklist_GEMBA_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  const downloadExperimentalPlan = () => {
    if (!state.d4.verificationPlan) return alert(t('noExpPlanAlert'));
    handleDownloadPDF('experimental-preview-container', `Plan_Experimental_${state.setup.caseName}`);
  };

  const generateExperimentalReport = () => {
    if (confirmedGembaHypotheses.length === 0) return alert(t('noGembaConfirmAlert'));
    runAi('d4Verify', 'd4Verify', { phenomenon: state.d2.phenomenon, causes: confirmedGembaHypotheses.map(d => d.cause) }, (data) => {
      setState((p: any) => ({ ...p, d4: { ...p.d4, verificationPlan: data || "" } }));
    });
  };

  const toggleHypothesis = (id: string) => {
    const current = state.d4.selectedHypotheses || [];
    const next = current.includes(id) ? current.filter((t: string) => t !== id) : [...current, id];
    setState((p: any) => ({ ...p, d4: { ...p.d4, selectedHypotheses: next } }));
  };

  const run5Whys = (id: string) => {
    const gembaData = state.d4.gembaDiagnostics?.find(d => d.hypothesisId === id);
    const targetText = id === state.d4.syntheticCause?.id ? state.d4.syntheticCause.text : (gembaData?.cause || "");
    const uniqueExecutionKey = `d4Whys-${id}-${Date.now()}`;
    runAi(uniqueExecutionKey, 'd4Whys', { targetCause: targetText, gembaConclusions: state.d4.gembaConclusions }, (data) => {
      const newAnalysis: FiveWhysAnalysis = { 
        id: `5w-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        targetCause: targetText, 
        whys: (data as any)?.whys || [], 
        systemicRootCause: (data as any)?.causa_raiz_sistemica || "" 
      };
      setState((p: any) => ({ ...p, d4: { ...p.d4, fiveWhysHistory: [...(p.d4.fiveWhysHistory || []), newAnalysis], finalCause: targetText, step: 4 } }));
    });
  };

  const updateWhyAnswer = (analysisId: string, whyIdx: number, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          const nextWhys = [...analysis.whys];
          nextWhys[whyIdx] = { ...nextWhys[whyIdx], answer: val };
          return { ...analysis, whys: nextWhys };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const updateWhyStep = (analysisId: string, whyIdx: number, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          const nextWhys = [...analysis.whys];
          nextWhys[whyIdx] = { ...nextWhys[whyIdx], step: val };
          return { ...analysis, whys: nextWhys };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const updateSystemicRootCause = (analysisId: string, val: string) => {
    setState((p: AppState) => {
      const nextHistory = p.d4.fiveWhysHistory.map(analysis => {
        if (analysis.id === analysisId) {
          return { ...analysis, systemicRootCause: val };
        }
        return analysis;
      });
      return { ...p, d4: { ...p.d4, fiveWhysHistory: nextHistory } };
    });
  };

  const generateSyntheticCause = () => {
    const fixedIds = state.d4.fixedRootCauseIds || [];
    if (fixedIds.length === 0) return alert(t('fixAtLeastOneRootCause'));
    const rootCauses = fixedIds.map(id => { 
      const analysis = state.d4.fiveWhysHistory?.find(a => a.id === id);
      return analysis?.systemicRootCause || t('unknownCause'); 
    });
    runAi('d4CombinedCause', 'd4CombinedCause', { phenomenon: state.d2.phenomenon, rootCauses }, (data) => {
      setState((p: AppState) => ({ ...p, d4: { ...p.d4, syntheticCause: { id: `synth-${Date.now()}`, text: (data as any)?.synthetic_cause || t('failureModeDefault') } } }));
    });
  };

  const toggleFixedRootCause = (analysisId: string) => {
    setState((p: AppState) => {
      const current = p.d4.fixedRootCauseIds || [];
      const next = current.includes(analysisId) 
        ? current.filter(id => id !== analysisId) 
        : [...current, analysisId];
      return { ...p, d4: { ...p.d4, fixedRootCauseIds: next } };
    });
  };

  const generateAllActions = () => {
    const fixedIds = [...(state.d4.fixedRootCauseIds || [])];
    if (fixedIds.length === 0) return alert(t('fixAtLeastOneRootCause'));
    
    const causes = fixedIds.map(id => {
      if (id.startsWith('synth-')) return { id, text: state.d4.syntheticCause?.text };
      const analysis = state.d4.fiveWhysHistory.find(a => a.id === id);
      return { id, text: analysis?.systemicRootCause };
    });
    
    runAi('d4Secondary', 'd4Secondary', { phenomenon: state.d2.phenomenon, causes }, (data) => {
      const actionMap: Record<string, ActionStep[]> = { ...(state.d4.secondaryActions || {}) };
      const results = (data as any)?.results || [];
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
              evidenceResponsible: t('areaLeader'),
              verificationHow: "",
              responsible: t('areaLeader'), 
              timeframe: defaultDate, 
              isFixed: false 
            })); 
          } 
        } 
      });
      setState((p: AppState) => ({ ...p, d4: { ...p.d4, secondaryActions: actionMap } }));
      alert(t('actionsMaterialized'));
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">

      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ClipboardDocumentCheckIcon className="w-10 h-10 text-slate-900" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">{t('d4')}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('forensicAnalysis')}
              <button onClick={() => setBanner({ title: t('forensicAnalysis'), content: t('tutD4Content') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex flex-wrap gap-4 mb-6">{[1, 2, 3, 4, 5].map(s => (<button key={s} onClick={() => setStep(s)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-[0.98] ${state.d4.step === s ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>{s === 1 ? `1. Ishikawa` : s === 2 ? `2. GEMBA` : s === 3 ? `3. 5 Whys` : s === 4 ? `4. ${t('rootCauseTitle')}` : `5. ${t('causesAndActionsTitle')}`}</button>))}</div>
      {state.d4.step === 1 && (<div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col"><div className="flex items-center justify-between mb-8"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">{t('ishikawaTitle')} <button onClick={() => setBanner({ title: t('ishikawaTitle'), content: t('ishikawaBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3><button onClick={generateIshikawa} className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-[0.95]">{t('genIshikawa')}</button></div><div className="space-y-12 h-auto">{mCategories.map((cat: string) => { const catHypotheses = (state.d4.hypotheses || []).filter((h: Hypothesis) => h.category === cat); return (<div key={cat} className="space-y-4 h-auto"><div className="flex items-center gap-3 border-b border-slate-100 pb-2"><Square2StackIcon className="w-5 h-5 text-slate-400" /><h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{cat}</h4></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">{catHypotheses.length > 0 ? (catHypotheses.map((h: Hypothesis) => (<div key={h.id} onClick={() => toggleHypothesis(h.id)} className={`p-6 rounded-3xl border-2 cursor-pointer transition-all flex flex-col justify-between active:scale-[0.98] h-auto ${state.d4.selectedHypotheses?.includes(h.id) ? 'border-blue-600 bg-blue-50 shadow-md ring-2 ring-blue-100' : 'border-slate-50 bg-white hover:border-blue-200'}`}><AutoExpandingTextarea value={h.text} onChange={(e: any) => { const nextH = [...(state.d4.hypotheses || [])]; const found = nextH.find(item => item.id === h.id); if (found) found.text = e.target.value; setState((p: any) => ({ ...p, d4: { ...p.d4, hypotheses: nextH } })); }} onClick={(e: any) => e.stopPropagation()} className="bg-transparent text-base font-bold text-slate-700 leading-snug outline-none focus:ring-1 focus:ring-blue-100 rounded p-1" /><div className="mt-4 flex justify-end">{state.d4.selectedHypotheses?.includes(h.id) ? (<span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg shadow-sm">{t('fix')}</span>) : (<span className="px-2 py-1 bg-slate-100 text-slate-400 text-[8px] font-black uppercase rounded-lg">{t('fix')}</span>)}</div></div>))) : (<div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-30"><p className="text-[10px] font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>)}</div></div>); })}</div>{(state.d4.selectedHypotheses || []).length > 0 && (<div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between"><div className="flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-blue-600" /><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('selectedHyp')} <span className="text-blue-600">{state.d4.selectedHypotheses.length}</span></p></div><button onClick={() => setStep(2)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all active:scale-[0.95]">{t('gembaConfirm')}</button></div>)}</div>)}
      {state.d4.step === 2 && (
        <>
          <div className="space-y-12">
            <div className="industrial-card rounded-xl p-4 h-auto flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  {t('floorValidation')}
                  <button onClick={() => setBanner({ title: t('floorValidation'), content: t('d4ChecklistBanner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex gap-2">
                  <button onClick={downloadGembaCSV} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-[0.95]">
                    <CloudArrowDownIcon className="w-3.5 h-3.5" /> {t('csvChecklist')}
                  </button>
                  <button onClick={generateGemba} disabled={loading === 'd4Gemba'} className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm disabled:opacity-50 active:scale-[0.95]">
                    {loading === 'd4Gemba' ? '...' : t('createChecklist')}
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-w-4xl mx-auto h-auto w-full">
                {(state.d4.gembaDiagnostics || []).map((diag: GembaDiagnostic, dIdx: number) => {
                  const checks = state.d4.observationChecks[diag.hypothesisId] || (diag.questions || []).map(() => null);
                  const noCount = checks.filter(v => v === 'no').length;
                  const isConfirmed = checks.filter(v => v !== null).length > 0 && (noCount / (diag.questions?.length || 1)) >= 0.5;
                  const noPercentage = (noCount / (diag.questions?.length || 1)) * 100;
                  return (
                    <div key={dIdx} className={`bg-white rounded-xl border transition-all flex flex-col overflow-hidden animate-slide-in h-auto ${isConfirmed ? 'border-red-500 shadow-lg ring-2 ring-red-50' : 'border-slate-100 shadow-sm'}`}>
                      <div className={`p-2 px-4 border-b flex items-center justify-between ${isConfirmed ? 'bg-red-50/80 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex items-center gap-2 flex-grow pr-4">
                          <div className={`p-1.5 rounded-md flex-shrink-0 ${isConfirmed ? 'bg-red-600 shadow-sm' : 'bg-slate-200'}`}>
                            <ExclamationTriangleIcon className={`w-4 h-4 ${isConfirmed ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                          <div className="space-y-0">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t('hypothesis')}</p>
                            <h4 className="text-[10px] font-black text-slate-900 uppercase leading-tight line-clamp-1">{diag.cause}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('evidence')}</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-700 ${isConfirmed ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${noPercentage}%` }}></div>
                              </div>
                              <span className={`text-[8px] font-black mono ${isConfirmed ? 'text-red-600' : 'text-blue-600'}`}>{noPercentage.toFixed(0)}%</span>
                            </div>
                          </div>
                          {isConfirmed && <div className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[7px] font-black uppercase tracking-tighter shadow-sm border border-red-400">{t('confirmed')}</div>}
                        </div>
                      </div>
                      <div className="p-3 space-y-1.5 h-auto flex flex-col bg-slate-50/20">
                        {(diag.questions || []).map((q, qIdx) => (
                          <div key={qIdx} className="p-1.5 px-3 bg-white rounded-md border border-slate-50 flex items-center gap-2 h-auto shadow-sm">
                            <div className="flex-grow text-[11px] font-bold text-slate-600 leading-tight">{q}</div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  const obsChecks = state.d4.observationChecks || {};
                                  const checksArr = obsChecks[diag.hypothesisId] ? [...obsChecks[diag.hypothesisId]] : [];
                                  checksArr[qIdx] = 'yes';
                                  setState((p: any) => ({ ...p, d4: { ...p.d4, observationChecks: { ...(p.d4.observationChecks || {}), [diag.hypothesisId]: checksArr } } }));
                                }}
                                className={`w-12 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${checks[qIdx] === 'yes' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50 hover:border-emerald-200 hover:text-emerald-500'}`}
                              >
                                {t('yes')}
                              </button>
                              <button
                                onClick={() => {
                                  const obsChecks = state.d4.observationChecks || {};
                                  const checksArr = obsChecks[diag.hypothesisId] ? [...obsChecks[diag.hypothesisId]] : [];
                                  checksArr[qIdx] = 'no';
                                  setState((p: any) => ({ ...p, d4: { ...p.d4, observationChecks: { ...(p.d4.observationChecks || {}), [diag.hypothesisId]: checksArr } } }));
                                }}
                                className={`w-12 py-1 rounded-md text-[8px] font-black uppercase border transition-all ${checks[qIdx] === 'no' ? 'bg-red-600 border-red-600 text-white shadow-sm' : 'bg-white text-slate-300 border-slate-50 hover:border-red-200 hover:text-red-500'}`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {confirmedGembaHypotheses.length > 0 && (
            <div className="industrial-card rounded-[2rem] p-8 border-l-[8px] border-l-orange-500 bg-white h-auto flex flex-col"><div className="flex items-center justify-between mb-8"><div className="flex items-center gap-4"><div className="p-3 bg-orange-100 rounded-2xl"><BeakerIcon className="w-6 h-6 text-orange-600" /></div>                  <div>
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      {t('expValidation')}
                      <button onClick={() => setBanner({ title: t('expValidation'), content: t('d4ExpBanner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_35px_rgba(245,158,11,1)]">
                        <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                      </button>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t('expPlanTitle')}</p>
                  </div></div><div className="flex items-center gap-4"><button onClick={downloadExperimentalPlan} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-md"><PrinterIcon className="w-4 h-4" /> PDF</button><div className="flex bg-slate-100 p-1 rounded-lg"><button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('edit')}</button><button onClick={() => setViewMode('preview')} className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{t('preview')}</button></div><button onClick={generateExperimentalReport} disabled={loading === 'd4Verify'} className="px-6 py-2 bg-orange-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-orange-700 transition-all disabled:opacity-50">{loading === 'd4Verify' ? '...' : t('genExpReport')}</button></div></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto"><div className="lg:col-span-2 h-auto flex flex-col"><div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 h-auto min-h-[500px] flex flex-col">{viewMode === 'edit' ? (<AutoExpandingTextarea value={state.d4.verificationPlan} onChange={(e: any) => setState((p: any) => ({ ...p, d4: { ...p.d4, verificationPlan: e.target.value } }))} className="bg-white border border-slate-200 rounded-2xl p-6 text-sm font-medium leading-relaxed outline-none transition-all mono" placeholder="..." />) : (<div id="experimental-preview-container" className="official-document p-10 rounded-[2rem] border border-slate-200 bg-white relative animate-scale-up h-auto flex flex-col min-h-[450px]"><div className="mb-8 border-b-2 border-slate-900 pb-4 no-print"><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('expPlanTitle')}</h2></div>{state.d4.verificationPlan ? (<div className="relative z-10 h-auto">{renderStyledMarkdown(state.d4.verificationPlan)}</div>) : (<div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 opacity-50 flex-grow py-20"><DocumentTextIcon className="w-16 h-16" /><p className="text-xs font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>)}</div>)}</div></div><div><div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm sticky top-10 h-auto flex flex-col"><h4 className="text-[10px] font-black text-slate-900 uppercase mb-6 tracking-widest flex items-center gap-2"><CheckBadgeIcon className="w-4 h-4 text-orange-600" /> {t('finalCauses')}</h4><div className="space-y-3 h-auto">{(confirmedGembaHypotheses || []).map((diag: GembaDiagnostic) => (<button key={diag.hypothesisId} onClick={() => { const current = state.d4.experimentalConfirmedCauses || []; const next = current.includes(diag.hypothesisId) ? current.filter(c => c !== diag.hypothesisId) : [...current, diag.hypothesisId]; setState((p: any) => ({ ...p, d4: { ...p.d4, experimentalConfirmedCauses: next } })); }} className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group h-auto ${state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-slate-50 hover:border-orange-200 bg-white'}`}><span className={`text-xs font-bold ${state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? 'text-emerald-700' : 'text-slate-600'}`}>{diag.cause}</span>                    {state.d4.experimentalConfirmedCauses?.includes(diag.hypothesisId) ? <CheckBadgeIconSolid className="w-5 h-5 text-emerald-600" /> : <CheckIcon className="w-5 h-5 text-slate-200 group-hover:text-orange-300 transition-colors" />}
                  </button>
                ))}
              </div>
              {(state.d4.experimentalConfirmedCauses || []).length > 0 && (
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.95]"
                >
                  {t('classifyCauses')} <BoltIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
)}
      {state.d4.step === 3 && (
        <div className="industrial-card rounded-[2rem] p-10 bg-slate-100 text-slate-900 shadow-xl border border-slate-200 relative h-auto flex flex-col">
          {experimentallyConfirmedHypotheses.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              <p className="text-xs font-black uppercase tracking-widest">{t('noExperimentallyConfirmedCauses')}</p>
            </div>
          ) : (
            <div className="space-y-12 h-auto flex flex-col">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-sm font-black text-blue-700 uppercase tracking-[0.3em] flex items-center gap-2">{t('pursuitWhys')} <button onClick={() => setBanner({ title: t('pursuitWhys'), content: t('fiveWhysBanner') })} className="transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3>
              </div>
              
              {/* Conclusiones del Gemba Section */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm relative h-auto flex flex-col mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4 text-purple-600" />
                      {t('gembaConclusions')}
                    </h4>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                      {t('uploadGembaNotesOrReportsTo')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <input 
                      type="file" 
                      id="gemba-conclusions-file-input"
                      onChange={handleGembaConclusionsUpload} 
                      accept=".pdf,.docx,.xlsx,.xls,.md,.txt" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => document.getElementById('gemba-conclusions-file-input')?.click()}
                      disabled={isExtractingGemba}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100 disabled:opacity-50"
                    >
                      <PaperClipIcon className="w-4 h-4" />
                      {isExtractingGemba 
                        ? (t('extracting')) 
                        : (t('uploadDocument'))}
                    </button>
                    {state.d4.gembaConclusions && (
                      <button
                        onClick={() => setState((p: any) => ({ ...p, d4: { ...p.d4, gembaConclusions: "" } }))}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                      >
                        {t('clear')}
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={state.d4.gembaConclusions || ""}
                  onChange={(e) => setState((p: any) => ({ ...p, d4: { ...p.d4, gembaConclusions: e.target.value } }))}
                  placeholder={t('writeOrPasteTheGembaSummary')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] p-4 text-xs font-semibold focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 outline-none transition-all placeholder-slate-400 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 gap-8">
                {experimentallyConfirmedHypotheses.map((diag: GembaDiagnostic) => {
                  const analysis = (state.d4.fiveWhysHistory || []).find((h: FiveWhysAnalysis) => h.targetCause === diag.cause);
                  const isLoading = loading?.includes(`d4Whys-${diag.hypothesisId}`);
                  
                  return (
                    <div key={diag.hypothesisId} className="animate-scale-up p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm relative h-auto flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest pr-12">
                          {t('confirmedCause')}: 
                          <span className="text-slate-900 ml-2">{diag.cause}</span>
                        </h5>
                        <div className="flex items-center gap-4">
                          {analysis && <CheckCircleIcon className="w-5 h-5 text-emerald-500" />}
                          <button 
                            onClick={() => run5Whys(diag.hypothesisId)} 
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            {isLoading ? '...' : analysis ? (t('regenerate')) : t('run5WhysIA')}
                          </button>
                          
                          <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100">
                            <input 
                              type="checkbox" 
                              checked={confirmedDeletes[diag.hypothesisId] || false}
                              onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, [diag.hypothesisId]: e.target.checked }))}
                              className="w-4 h-4 accent-red-600 cursor-pointer"
                              title={t('confirmToDelete')}
                            />
                            <button 
                              onClick={() => {
                                if (confirmedDeletes[diag.hypothesisId]) {
                                  handleDeleteConfirmedCause(diag.hypothesisId);
                                  setConfirmedDeletes(prev => {
                                    const next = { ...prev };
                                    delete next[diag.hypothesisId];
                                    return next;
                                  });
                                } else {
                                  alert(t('checkTheBoxToConfirmDeletion'));
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${confirmedDeletes[diag.hypothesisId] ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              {t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(state.d4.fiveWhysHistory || []).length > 0 && (
                <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
                  <button onClick={() => setStep(4)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                    {t('viewRootCauseAnalysis')} <ArrowPathIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {state.d4.step === 4 && (
        <div className="space-y-10 animate-slide-in">
          <div className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('rootCauseTitle')}</h3>
                <button onClick={() => setBanner({ title: t('rootCauseTitle'), content: t('fiveWhysBanner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Final Analysis & Root Cause Identification.</p>
              </div>
              {(state.d4.fiveWhysHistory || []).length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={confirmedDeletes['all'] || false}
                      onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, all: e.target.checked }))}
                      className="w-4 h-4 accent-red-600"
                    />
                    <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">{t('confirmAll')}</span>
                  </label>
                  <button 
                    onClick={() => {
                      if (confirmedDeletes['all']) {
                        handleDeleteAllAnalyses();
                        setConfirmedDeletes(prev => ({ ...prev, all: false }));
                      } else {
                        alert(t('checkTheBoxToConfirmMass'));
                      }
                    }}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${confirmedDeletes['all'] ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    {t('deleteAll')}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-12">
              {(state.d4.fiveWhysHistory || []).map((analysis) => {
                const isFixed = state.d4.fixedRootCauseIds?.includes(analysis.id);
                return (
                  <div key={analysis.id} className={`p-8 rounded-[2.5rem] border-2 transition-all h-auto flex flex-col ${isFixed ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
                    <div className="flex justify-between items-start mb-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('origin')}</p>
                        <h4 className="text-sm font-bold text-slate-700 italic">{analysis.targetCause}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleFixedRootCause(analysis.id)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-[0.95] ${isFixed ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                        >
                          {isFixed ? (t('fixed')) : t('fix')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-6 mb-10">
                      {(analysis.whys || []).map((w: FiveWhyStep, i: number) => (
                        <div key={i} className="flex gap-6 items-start">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-black flex-shrink-0 border border-slate-200">W{i+1}</div>
                          <div className="flex-grow pt-1">
                            <input 
                              type="text"
                              value={w.step} 
                              onChange={(e) => updateWhyStep(analysis.id, i, e.target.value)}
                              className="w-full bg-transparent text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest outline-none focus:ring-1 focus:ring-blue-100 rounded"
                            />
                            <AutoExpandingTextarea 
                              value={w.answer} 
                              onChange={(e: any) => updateWhyAnswer(analysis.id, i, e.target.value)}
                              className="bg-transparent text-sm font-bold text-slate-600 leading-relaxed italic outline-none focus:ring-1 focus:ring-blue-100 rounded w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`p-8 rounded-2xl border-2 transition-all ${isFixed ? 'bg-emerald-600 border-emerald-400 shadow-lg' : 'bg-blue-600 border-blue-400 shadow-md'}`}>
                      <p className={`text-[9px] font-black uppercase mb-2 tracking-[0.3em] ${isFixed ? 'text-emerald-100' : 'text-blue-100'}`}>{t('systemicRoot')}</p>
                      <AutoExpandingTextarea 
                        value={analysis.systemicRootCause} 
                        onChange={(e: any) => updateSystemicRootCause(analysis.id, e.target.value)}
                        className="bg-transparent text-xl font-black text-white uppercase tracking-tight leading-tight outline-none w-full"
                      />
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3 bg-red-50 p-3 rounded-2xl border border-red-100">
                        <input 
                          type="checkbox" 
                          checked={confirmedDeletes[analysis.id] || false}
                          onChange={(e) => setConfirmedDeletes(prev => ({ ...prev, [analysis.id]: e.target.checked }))}
                          className="w-5 h-5 accent-red-600 cursor-pointer"
                        />
                        <span className="text-[9px] font-black text-red-700 uppercase tracking-widest">{t('confirmDelete2')}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          if (confirmedDeletes[analysis.id]) {
                            handleDeleteAnalysis(analysis.id);
                            setConfirmedDeletes(prev => {
                              const next = { ...prev };
                              delete next[analysis.id];
                              return next;
                            });
                          } else {
                            alert(t('checkTheBoxToConfirm'));
                          }
                        }}
                        className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${confirmedDeletes[analysis.id] ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                      >
                        {t('deleteAnalysis')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {(state.d4.fixedRootCauseIds || []).length > 0 && (
              <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
                <button onClick={() => setStep(5)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                  {t('generateActions')} <ArrowPathIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {state.d4.step === 5 && (
        <div className="space-y-10 animate-slide-in">
          <div className="industrial-card rounded-[2.5rem] p-10 bg-white border border-slate-100 shadow-xl h-auto flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{t('causesAndActionsTitle')}</h3>
                <button onClick={() => setBanner({ title: t('causesAndActionsTitle'), content: t('d5Banner') })} className="text-slate-400 hover:text-slate-600 transition-all transform hover:scale-125">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                </button>
              </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Action Materialization for Fixed Root Causes.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={generateAllActions} disabled={loading === 'd4Secondary' || (state.d4.fixedRootCauseIds || []).length === 0} className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-blue-700 disabled:opacity-30 transition-all">{t('genActions')}</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">
              {(state.d4.fixedRootCauseIds || []).map((id: string) => {
                const analysis = state.d4.fiveWhysHistory?.find(a => a.id === id);
                if (!analysis) return null;
                const isPrimary = state.d4.primaryCauseId === id;
                const actions = state.d4.secondaryActions?.[id] || [];
                return (
                  <div key={id} className={`p-8 rounded-[2rem] border-2 transition-all h-auto flex flex-col ${isPrimary ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-2 rounded-lg ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{isPrimary ? <StarIcon className="w-5 h-5" /> : <Square2StackIcon className="w-5 h-5" />}</div>
                      <button onClick={() => setState((p: any) => ({ ...p, d4: { ...p.d4, primaryCauseId: id } }))} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-blue-100'}`}>{isPrimary ? t('primary') : t('fix')}</button>
                    </div>
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{t('rootCauseTitle')}</p>
                    <h4 className="text-sm font-bold text-slate-800 leading-relaxed mb-6">{analysis.systemicRootCause}</h4>
                    <div className="space-y-4 mt-auto">
                      <div className="h-px bg-slate-100 w-full mb-4"></div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('actionsTitle')}</p>
                      {actions.length > 0 ? (
                        <div className="space-y-2 h-auto">
                          {actions.map((action, idx) => (
                            <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-[11px] font-bold text-slate-600">
                              <AutoExpandingTextarea value={action.action} onChange={(e: any) => { const nextActions = [...(state.d4.secondaryActions[id] || [])]; nextActions[idx] = { ...nextActions[idx], action: e.target.value }; setState((p: any) => ({ ...p, d4: { ...p.d4, secondaryActions: { ...p.d4.secondaryActions, [id]: nextActions } } })); }} className="bg-transparent text-[11px] font-bold text-emerald-800 outline-none w-full" />
                            </div>
                          ))}
                        </div>
                      ) : <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center opacity-40"><p className="text-[9px] font-black uppercase">{t('waitingAnalysis')}</p></div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex justify-end pt-8 border-t border-slate-200">
              <button onClick={() => setActiveTab(Tab.D5)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all flex items-center gap-3 active:scale-[0.95]">
                {t('advanceACP')} <ArrowPathIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
