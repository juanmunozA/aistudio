import React, { useState, useRef } from 'react';
import { Tab, type AppState, type ACPPlan, type ActionStep, type CostInputs, type CostBreakdown } from '../../types';
import { MagnifyingGlassIcon, BanknotesIcon, BeakerIcon, ChartBarIcon, BuildingOffice2Icon, QuestionMarkCircleIcon, CogIcon, ScaleIcon, TrashIcon, SparklesIcon, TruckIcon, ArchiveBoxIcon, UserGroupIcon, ReceiptPercentIcon, InboxStackIcon, BuildingLibraryIcon, CurrencyDollarIcon, ClockIcon, XMarkIcon, PaperClipIcon } from '@heroicons/react/24/outline';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { DEFAULT_COST_INPUTS, INITIAL_STATE } from '../../shared/constants/initialState';
import { extractTextFromFile } from '../../shared/utils/files';
import { formatCurrencyInput } from '../../shared/utils/format';

export const D1D2Section = ({ state, setState, runAi, loading, setActiveTab, t, setBanner }: any) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImprovementOpportunityToD5 = () => {
    const phenomenonText = state.d2.phenomenon || state.d2.fieldDataInput || state.setup.caseName;
    if (!phenomenonText || phenomenonText.trim() === '') {
      alert(t('pleaseEnterThePhenomenonDescriptionIn'));
      return;
    }

    const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const caseNumberMatch = state.setup.caseName.match(/^\d+/);
    const caseNumber = caseNumberMatch ? caseNumberMatch[0] : "";

    runAi(
      'd5Improvement',
      'd5Improvement',
      { phenomenonText },
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
            t('implementStandardOrProcedureForThe'),
            t('trainPersonnelOnTheNewWorking'),
            t('establishOperationalControlsAndChecklistsAt'),
            t('auditAndVerifyInGembaThe')
          ];
        }

        const formattedActions: ActionStep[] = actionList.slice(0, 4).map((actText: any, idx: number) => {
          const act = typeof actText === 'string' ? actText : (actText?.action || actText?.text || String(actText));
          return {
            id: `action-improvement-${idx}-${Date.now()}`,
            actionId: caseNumber ? `${caseNumber}-${idx + 1}` : `${idx + 1}`,
            action: act,
            evidenceHow: t('standardImplementationDocumentOrRecord'),
            evidenceDate: defaultDate,
            evidenceResponsible: state.setup.responsible || (t('areaLeader')),
            verificationHow: t('gembaAuditAndKpiFollowUp'),
            responsible: state.setup.responsible || (t('areaLeader')),
            timeframe: defaultDate,
            isFixed: true
          };
        });

        const newPlan: ACPPlan = {
          id: `acp-improvement-${Date.now()}`,
          rootCause: phenomenonText,
          title: t('improvementPlanTitle', { text: phenomenonText.substring(0, 40) }),
          introduction: t('improvementPlanIntro'),
          actions: formattedActions,
          type: 'primary'
        };

        setState((p: AppState) => ({
          ...p,
          d5_d6: {
            ...(p.d5_d6 || {}),
            step: 1,
            acpPlans: [newPlan]
          }
        }));

        setActiveTab(Tab.D5);
      }
    );
  };

  const handleResetSection = () => {
    setState((p: AppState) => ({
      ...p,
      d2: INITIAL_STATE.d2,
      costs: INITIAL_STATE.costs
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsExtracting(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(extension || '');

      if (isImage) {
        try {
          const base64 = await fileToBase64(file);
          setState((p: AppState) => ({
            ...p,
            d2: { ...p.d2, images: [...(p.d2.images || []), base64] }
          }));
        } catch (err) {
          console.error("Error converting image to base64", err);
        }
      } else {
        const text = await extractTextFromFile(file);
        if (text) {
          setState((p: AppState) => ({
            ...p,
            d2: { ...p.d2, fieldDataInput: (p.d2.fieldDataInput ? p.d2.fieldDataInput + '\n\n' : '') + text }
          }));
        }
      }
    }

    setIsExtracting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunD2Analysis = () => {
    runAi(
      'd2', 
      'd2', 
      { fieldDataInput: state.d2.fieldDataInput, images: state.d2.images || [] }, 
      (data) => setState((p: any) => ({ 
        ...p, 
        d2: { 
          ...p.d2, 
          phenomenon: data?.phenomenon_description || "", 
          analysis: "", 
          fiveW2H: data?.fiveW2H 
        } 
      }))
    );
  };

  const [activeSubTab, setActiveSubTab] = useState<'definition' | 'financial'>('definition');
  const costFields = [
    { label: t('labor'), field: "manoDeObra", icon: UserGroupIcon },
    { label: t('rawMaterial'), field: "materiaPrima", icon: InboxStackIcon },
    { label: t('pkgMaterial'), field: "materialEmpaque", icon: ArchiveBoxIcon },
    { label: t('trimLoss'), field: "recorte", icon: ReceiptPercentIcon },
    { label: t('physicalWaste'), field: "desperdicio", icon: TrashIcon },
    { label: t('finishedProduct'), field: "productoTerminado", icon: BuildingOffice2Icon },
    { label: t('machineryEquipment'), field: "maquinariaEquipos", icon: CogIcon },
    { label: t('infrastructureWorks'), field: "infraestructura", icon: BuildingLibraryIcon },
    { label: t('logistics'), field: "logisticos", icon: TruckIcon },
    { label: t('testsTrials'), field: "ensayosPruebas", icon: BeakerIcon },
    { label: t('downtimeLostProfits'), field: "lucroCesante", icon: ClockIcon },
    { label: t('otherItems'), field: "otros", icon: BanknotesIcon },
  ];
  const updateCostInput = (field: keyof CostInputs, val: string) => { setState((p: AppState) => ({ ...p, costs: { ...p.costs, inputs: { ...p.costs.inputs, [field]: formatCurrencyInput(val, p.costs.currency) } } })); };
  const updateBreakdownItem = (idx: number, field: keyof CostBreakdown, val: string) => { const nextBreakdown = [...(state.costs.breakdown || [])]; if (nextBreakdown[idx]) { nextBreakdown[idx] = { ...nextBreakdown[idx], [field]: val }; setState((p: AppState) => ({ ...p, costs: { ...p.costs, breakdown: nextBreakdown } })); } };
  const updateCurrency = (currency: 'COP' | 'CRC' | 'USD') => { setState((p: AppState) => ({ ...p, costs: { ...p.costs, currency } })); };
  const handleEstimateCosts = () => {
    const inputs = state.costs?.inputs || DEFAULT_COST_INPUTS;
    if (!state.d2.phenomenon) return alert(t('waitingAnalysis'));
    runAi('costs', 'costs', { inputs, phenomenon: state.d2.phenomenon, currency: state.costs.currency }, (data) => setState((p: any) => ({ ...p, costs: { ...p.costs, totalLoss: data?.total_loss_estimate || "", breakdown: data?.cost_breakdown || [] } })));
  };
  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
            <MagnifyingGlassIcon className="w-7 h-7 text-slate-900" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-0.5">{t('d1d2')}</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
              {t('phenomenology')}
              <button onClick={() => setBanner({ title: t('phenomenology'), content: t('d1d2Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                <QuestionMarkCircleIcon className="w-7 h-7" />
              </button>
            </p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>
      <div className="flex gap-4 mb-4"><button onClick={() => setActiveSubTab('definition')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeSubTab === 'definition' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}>1. {t('defProblem')}</button>        <button 
          onClick={() => setActiveSubTab('financial')} 
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex items-center gap-2 ${activeSubTab === 'financial' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}
        >
          2. {t('finImpact')}
          <QuestionMarkCircleIcon 
            className="w-7 h-7 text-emerald-400 cursor-help transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" 
            onClick={(e) => { e.stopPropagation(); setBanner({ title: t('finImpact'), content: t('financialBanner') }); }} 
          />
        </button></div>
      {activeSubTab === 'definition' ? (
        <div className="grid grid-cols-1 gap-10 animate-slide-in">
          <div className="w-full">
            <div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  {t('fieldInput')}
                  <button onClick={() => setBanner({ title: t('fieldInput'), content: t('fieldInputBanner') })} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                  </button>
                </h3>
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".pdf,.docx,.xlsx,.xls,.md,.txt,image/*" 
                    multiple
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                  >
                    <PaperClipIcon className="w-4 h-4" />
                    {isExtracting ? t('extractingText') : t('uploadFile')}
                  </button>
                  <div className="flex items-center gap-2">
                    <a 
                      href="https://gemini.google.com/gem/1GockJ8pLRBCQeZUBypsA_ujLNCZc1aAW?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {t('aiAgentProblemDef')}
                    </a>
                    <button 
                      onClick={() => setBanner({ title: t('aiAgentProblemDef'), content: t('aiAgentBanner') })} 
                      className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]"
                      title={t('aiAgentProblemDef')}
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">{t('fileTypes')} + Images</p>
              
              {state.d2.images && state.d2.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {state.d2.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Upload ${idx}`} className="w-20 h-20 object-cover rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setState((p: AppState) => ({ ...p, d2: { ...p.d2, images: p.d2.images?.filter((_, i) => i !== idx) } }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <AutoExpandingTextarea value={state.d2.fieldDataInput} onChange={(e: any) => setState((p: any) => ({ ...p, d2: { ...p.d2, fieldDataInput: e.target.value } }))} placeholder={t('fieldPlaceholder')} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-600/20 outline-none transition-all leading-relaxed" />
              <button onClick={handleRunD2Analysis} disabled={loading === 'd2'} className="w-full mt-4 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30">{loading === 'd2' ? '...' : t('runIA')}</button>
            </div>
          </div>
          <div className="w-full h-auto"><div className="industrial-card rounded-[2rem] p-8 h-auto flex flex-col"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  {t('fieldReport')}
                  <button onClick={() => setBanner({ title: t('fieldReport'), content: t('d1d2Banner') })} className="text-amber-500 hover:text-amber-600 transition-all transform hover:scale-125 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]">
                    <QuestionMarkCircleIcon className="w-7 h-7" />
                  </button>
                </h3>{state.d2.fiveW2H ? (<div className="space-y-6 h-auto"><div className="p-6 bg-blue-600 rounded-[2rem] shadow-xl border-4 border-blue-400 h-auto flex flex-col"><AutoExpandingTextarea value={state.d2.phenomenon} onChange={(e: any) => setState((p: any) => ({ ...p, d2: { ...p.d2, phenomenon: e.target.value } }))} className="bg-transparent text-sm font-bold text-white leading-relaxed outline-none focus:ring-1 focus:ring-blue-300 rounded p-1" placeholder="Description..." /></div><div className="grid grid-cols-1 gap-6 h-auto">{Object.entries(state.d2.fiveW2H).map(([k, v]: [string, any], idx) => (<div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-all shadow-sm h-auto flex flex-col"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block border-b border-slate-200 pb-1">{t(k) || k}</label><AutoExpandingTextarea value={v} onChange={(e: any) => { const next5W = { ...(state.d2.fiveW2H || {}), [k]: e.target.value }; setState((p: any) => ({ ...p, d2: { ...p.d2, fiveW2H: next5W } })); }} className="bg-transparent text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-100 rounded p-1" /></div>))}</div></div>) : <div className="text-center py-24 opacity-30"><MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4" /><p className="text-xs font-black uppercase tracking-widest">{t('waitingAnalysis')}</p></div>}</div></div>
        </div>
      ) : (
        <div className="industrial-card rounded-[2rem] p-8 border-l-[8px] border-l-emerald-600 bg-white h-auto flex flex-col animate-slide-in"><div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"><h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3"><BanknotesIcon className="w-6 h-6 text-emerald-600" /> {t('costQuality')} <button onClick={() => setBanner({ title: t('costQuality'), content: t('financialBanner') })} className="ml-1 transition-all transform hover:scale-125"><QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" /></button></h3><div className="flex flex-col gap-1 w-full md:w-auto"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CurrencyDollarIcon className="w-3.5 h-3.5" /> {t('selectCurrency')}</label><select value={state.costs.currency} onChange={(e) => updateCurrency(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-emerald-600/20 outline-none"><option value="COP">Pesos Colombianos (COP)</option><option value="CRC">Colones Costa Rica (CRC)</option><option value="USD">American Dollars (USD)</option></select></div></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">{costFields.map((field, idx) => (<div key={idx} className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><field.icon className="w-4 h-4 text-emerald-500" /> {field.label}</label><input type="text" value={(state.costs.inputs?.[field.field as keyof CostInputs] || "")} onChange={(e) => updateCostInput(field.field as keyof CostInputs, e.target.value)} placeholder="$ 0" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-black focus:ring-2 focus:ring-emerald-600/20 outline-none transition-all mono" /></div>))}</div><div className="flex flex-col lg:flex-row gap-10 items-center border-t border-slate-100 pt-10"><button onClick={handleEstimateCosts} disabled={loading === 'costs'} className="w-full lg:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-[0.95] disabled:opacity-30">{loading === 'costs' ? '...' : t('estimateCosts')}</button><div className="flex-grow space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-2"><ScaleIcon className="w-3.5 h-3.5" /> {t('totalLoss')}</p><input type="text" value={state.costs.totalLoss} onChange={(e) => setState((p: AppState) => ({ ...p, costs: { ...p.costs, totalLoss: e.target.value } }))} className="w-full bg-slate-900 rounded-[2rem] p-8 text-center border-b-4 border-emerald-500 text-4xl font-black text-white mono tracking-tighter outline-none focus:ring-2 focus:ring-emerald-600/50" /></div></div>{state.costs.breakdown && state.costs.breakdown.length > 0 && (<div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">{state.costs.breakdown.map((item, idx) => { const isIntangible = item.category?.toLowerCase().includes('intangible'); const isLegal = item.category?.toLowerCase().match(/legal|sanción|sanction/i); return (<div key={idx} className={`p-6 rounded-3xl border transition-all h-auto flex flex-col ${isIntangible ? 'bg-indigo-50 border-indigo-200 shadow-md ring-4 ring-indigo-50/50' : isLegal ? 'bg-orange-50 border-orange-200' : 'bg-slate-50/50 border-slate-100'}`}><div className="flex items-center gap-3 mb-3">{isIntangible ? <SparklesIcon className="w-5 h-5 text-indigo-600" /> : <ChartBarIcon className="w-5 h-5 text-emerald-500" />}<input type="text" value={item.category} onChange={(e) => updateBreakdownItem(idx, 'category', e.target.value)} className={`text-[10px] font-black uppercase tracking-widest bg-transparent outline-none w-full ${isIntangible ? 'text-indigo-700' : 'text-slate-900'}`} /></div><AutoExpandingTextarea value={item.impact_description} onChange={(e: any) => updateBreakdownItem(idx, 'impact_description', e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 leading-snug mb-4 focus:ring-1 focus:ring-emerald-100 rounded" /><input type="text" value={item.estimated_value} onChange={(e) => updateBreakdownItem(idx, 'estimated_value', e.target.value)} className={`w-full mt-auto bg-white/50 border border-slate-200 rounded-lg p-2 text-sm font-black mono outline-none focus:ring-2 focus:ring-emerald-600/20 ${isIntangible ? 'text-indigo-600' : 'text-slate-900'}`} /></div>); })}</div>)}</div>
      )}

      {state.setup.type === 'Oportunidad de mejora' && (
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={handleImprovementOpportunityToD5}
            disabled={loading === 'd5Improvement'}
            className="w-full md:w-auto px-8 py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            <SparklesIcon className="w-5 h-5 text-white" />
            {loading === 'd5Improvement' 
              ? '...' 
              : 'Oportunidad de mejora, pasar a D5: GESTION ACP'
            }
          </button>
        </div>
      )}
    </div>
  );
};
