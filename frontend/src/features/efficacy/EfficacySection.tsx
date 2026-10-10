import { type AppState, type ACPPlan, type EfficacyProtocol } from '../../types';
import { ShieldCheckIcon, ArrowPathIcon, QuestionMarkCircleIcon, SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { AutoExpandingTextarea } from '../../shared/components/AutoExpandingTextarea';
import { ResetButton } from '../../shared/components/ResetButton';
import { renderStyledMarkdown } from '../../shared/components/StyledMarkdown';
import { INITIAL_STATE } from '../../shared/constants/initialState';
import { caseActions, useCaseState } from '../../store/caseStore';
import type { SectionProps } from '../sectionProps';
import { useAiRunner } from '../ai/useAiRunner';

export const EfficacySection = ({ t, setBanner }: SectionProps) => {
  const state = useCaseState();
  const { runAi, loading } = useAiRunner();
  const handleResetSection = () => {
    caseActions.updateSection('efficacy', (current) => INITIAL_STATE.efficacy);
  };

  const generateProtocols = () => {
    const fixedActions = (state.d5_d6.acpPlans || []).flatMap((p: ACPPlan) => p.actions || []).filter((a: any) => a.isFixed);
    if (fixedActions.length === 0) return alert(t('fixActionsInD5First'));

    const actionsText = fixedActions.map((a: any) => `- [ID: ${a.actionId || 'N/A'}] ${a.action} (Responsable: ${a.responsible})`).join('\n');
    const rootCausesText = (state.d4.fiveWhysHistory || []).map((h: any) => h.systemicRootCause).filter(Boolean).join('; ');
    const allIds = fixedActions.map((a: any) => a.actionId || 'N/A').filter(Boolean).join('\n');
    const today = new Date().toISOString().split('T')[0];
    
    runAi('efficacy', 'efficacyValidation', { acpPlans: state.d5_d6.acpPlans || [], rootCauses: (state.d4.fiveWhysHistory || []).map((h: any) => h.systemicRootCause) }, (data) => {
      let rawProtocols = (data as any).protocols || [];
      if (!Array.isArray(rawProtocols) || rawProtocols.length === 0) {
        rawProtocols = [data];
      }

      const p = rawProtocols[0] || {};
      
      const shortDescFallback = fixedActions.map((a: any) => {
        const words = (a.action || '').trim().split(/\s+/).slice(0, 4).join(' ');
        return `${a.actionId ? `${a.actionId}: ` : ''}${words}`;
      }).join('; ');

      const formatIdsAsStacked = (idStr: string) => {
        if (!idStr) return '';
        return idStr.split(/,\s*|\n+/).map((s: string) => s.trim()).filter(Boolean).join('\n');
      };

      const rawId = (p.id && p.id.length >= 3) ? p.id : allIds;

      let rawKpi = (p.kpi || '').trim();
      if (!rawKpi) {
        rawKpi = t('t100ComplianceInFieldVerification0');
      } else if (!/\d/.test(rawKpi)) {
        rawKpi = `${rawKpi} (Meta: ${t('t100Compliance0Recurrences')})`;
      }

      const unifiedProtocol: EfficacyProtocol = {
        id: formatIdsAsStacked(rawId),
        action: p.action || shortDescFallback,
        verificationMethod: p.verificationMethod || '',
        kpi: rawKpi,
        auditFrequency: p.auditFrequency || '',
        contingencyPlan: p.contingencyPlan || '',
        executionResponsible: p.executionResponsible || fixedActions[0]?.responsible || state.setup.responsible || '',
        executionDate: p.executionDate || today,
        verificationResponsible: p.verificationResponsible || state.setup.responsible || '',
        verificationDate: p.verificationDate || today,
        isEffective: p.isEffective || 'SI'
      };

      caseActions.updateSection('efficacy', (current) => ({
          ...current,
          protocols: [unifiedProtocol]
        }));
    });
  };

  const generateGuide = (protocol: EfficacyProtocol) => {
    if (!protocol.verificationMethod) return;
    
    // If already generated, don't call again
    if (state.efficacy.verificationGuides && state.efficacy.verificationGuides[protocol.id]) return;

    runAi(`guide-${protocol.id}`, 'verificationGuide', { verificationMethod: protocol.verificationMethod }, (data) => {
      caseActions.updateSection('efficacy', (current) => ({
          ...current,
          verificationGuides: {
            ...(current.verificationGuides || {}),
            [protocol.id]: typeof data === 'string' ? data : (data.text || JSON.stringify(data))
          }
        }));
    });
  };

  const updateProtocol = (idx: number, field: keyof EfficacyProtocol, value: string) => {
    caseActions.updateCase((p: AppState) => {
      const nextProtocols = [...p.efficacy.protocols];
      nextProtocols[idx] = { ...nextProtocols[idx], [field]: value };
      return { ...p, efficacy: { ...p.efficacy, protocols: nextProtocols } };
    });
  };

  return (
    <div className="space-y-10 animate-slide-in">
      <div className="flex items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
            <ShieldCheckIcon className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1 flex items-center gap-2">
              {t('efficacyValidation')}
              <button onClick={() => setBanner({ title: t('efficacyValidation'), content: t('efficacyPlanBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
                <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
              </button>
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{t('efficacyTitle')}</p>
          </div>
        </div>
        <ResetButton onReset={handleResetSection} t={t} />
      </div>

      <div className="flex justify-end mb-6">
        <button 
          onClick={generateProtocols} 
          disabled={loading === 'efficacy'} 
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" /> {loading === 'efficacy' ? '...' : t('genEfficacy')}
        </button>
      </div>

      <div className="space-y-10">
        <div className="industrial-card rounded-[2rem] p-6 bg-white border border-slate-100 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 mb-6 border-l-4 border-emerald-600 pl-4">
            <h3 className="text-lg font-black uppercase text-slate-800">{t('efficacyValidationPlan')}</h3>
            <button onClick={() => setBanner({ title: t('efficacyValidationPlan'), content: t('efficacyPlanBanner') })} className="text-slate-300 hover:text-slate-500 transition-all transform hover:scale-125">
              <QuestionMarkCircleIcon className="w-7 h-7 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
            </button>
          </div>
          <table className="w-full text-left border-collapse min-w-[900px] table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[8%]">{t('actionId')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[18%]">{t('action')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationMethod')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('kpi')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('auditFrequency')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[14%]">{t('contingencyPlan')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionResponsible')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionDate')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.efficacy.protocols.length > 0 ? (
                state.efficacy.protocols.map((protocol: EfficacyProtocol, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.id} 
                        onChange={(e: any) => updateProtocol(idx, 'id', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-700 outline-none w-full border-none p-0 focus:ring-0 leading-tight whitespace-pre-line"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.action} 
                        onChange={(e: any) => updateProtocol(idx, 'action', e.target.value)}
                        className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <div className="relative flex items-center gap-2">
                        <AutoExpandingTextarea 
                          value={protocol.verificationMethod} 
                          onChange={(e: any) => updateProtocol(idx, 'verificationMethod', e.target.value)}
                          className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                        />
                        <button 
                          onClick={() => generateGuide(protocol)}
                          disabled={loading === `guide-${protocol.id}`}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all shadow-sm border border-emerald-100 bg-white disabled:opacity-50 flex-shrink-0"
                          title={t('genGuide')}
                        >
                          {loading === `guide-${protocol.id}` ? (
                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          ) : (
                            <SparklesIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.kpi} 
                        onChange={(e: any) => updateProtocol(idx, 'kpi', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.auditFrequency} 
                        onChange={(e: any) => updateProtocol(idx, 'auditFrequency', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <AutoExpandingTextarea 
                        value={protocol.contingencyPlan} 
                        onChange={(e: any) => updateProtocol(idx, 'contingencyPlan', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="text"
                        value={protocol.executionResponsible} 
                        onChange={(e: any) => updateProtocol(idx, 'executionResponsible', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="date"
                        value={protocol.executionDate} 
                        onChange={(e: any) => updateProtocol(idx, 'executionDate', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center opacity-30 italic text-sm">
                    {t('waitingAnalysis')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Módulo Adicional: Guías Técnicas de Verificación */}
        {state.efficacy.protocols.length > 0 && (
          <div className="space-y-6 animate-fade-in mt-12">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BookOpenIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">
                {t('fieldVerificationTechnicalGuides')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {state.efficacy.protocols.map((protocol: EfficacyProtocol) => (
                <div key={protocol.id} className="industrial-card rounded-[2rem] p-8 bg-white border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6 border-b border-slate-50 pb-4">
                    <div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1 block whitespace-pre-line">ID: {protocol.id}</span>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{protocol.verificationMethod}</h4>
                    </div>
                    {!state.efficacy.verificationGuides?.[protocol.id] && (
                      <button 
                        onClick={() => generateGuide(protocol)}
                        disabled={loading === `guide-${protocol.id}`}
                        className="px-4 py-2 bg-emerald-600 text-white text-[9px] font-black rounded-xl uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2"
                      >
                        {loading === `guide-${protocol.id}` ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                        {t('genGuide')}
                      </button>
                    )}
                  </div>
                  
                  <div className="min-h-[100px]">
                    {state.efficacy.verificationGuides?.[protocol.id] ? (
                      <div className="markdown-body text-sm text-slate-700 leading-relaxed">
                        {renderStyledMarkdown(state.efficacy.verificationGuides[protocol.id])}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        {loading === `guide-${protocol.id}` ? (
                          <div className="flex flex-col items-center gap-3">
                            <ArrowPathIcon className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('waitingAnalysis')}</p>
                          </div>
                        ) : (
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">
                            {t('clickTheButtonInTheTable')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="industrial-card rounded-[2rem] p-6 bg-white border border-slate-100 shadow-sm overflow-x-auto">
          <h3 className="text-lg font-black uppercase text-slate-800 mb-6 border-l-4 border-emerald-600 pl-4">{t('efficacyVerification')}</h3>
          <table className="w-full text-left border-collapse min-w-[600px] table-fixed">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('actionId')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[40%]">{t('action')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationResponsible')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('verificationDate')}</th>
                <th className="p-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('effective')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.efficacy.protocols.length > 0 ? (
                state.efficacy.protocols.map((protocol: EfficacyProtocol, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2">
                      <p className="text-[10px] font-bold text-slate-700 whitespace-pre-line leading-tight">{protocol.id}</p>
                    </td>
                    <td className="p-2">
                      <p className="text-[10px] font-bold text-slate-600">{protocol.action}</p>
                    </td>
                    <td className="p-2">
                      <input 
                        type="text"
                        value={protocol.verificationResponsible} 
                        onChange={(e: any) => updateProtocol(idx, 'verificationResponsible', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <input 
                        type="date"
                        value={protocol.verificationDate} 
                        onChange={(e: any) => updateProtocol(idx, 'verificationDate', e.target.value)}
                        className="bg-transparent text-[10px] font-medium text-slate-600 outline-none w-full border-none p-0 focus:ring-0"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        value={protocol.isEffective || ''}
                        onChange={(e: any) => updateProtocol(idx, 'isEffective', e.target.value)}
                        className="bg-transparent text-[10px] font-black text-emerald-600 outline-none w-full border-none p-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="">-</option>
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center opacity-30 italic text-sm">
                    {t('waitingAnalysis')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
