import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Tab, type AppState } from '../types';
import { ClipboardDocumentCheckIcon, ShieldCheckIcon, MagnifyingGlassIcon, WrenchScrewdriverIcon, ArrowPathIcon, BuildingOffice2Icon, AdjustmentsHorizontalIcon, QuestionMarkCircleIcon, CloudArrowDownIcon, CheckBadgeIcon, DocumentIcon, LightBulbIcon, SparklesIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CheckBadgeIcon as CheckBadgeIconSolid, ArrowsPointingOutIcon, ArrowsPointingInIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { runAiOperation, type AiOperation } from '../services/api/aiApi';
import { casesApi } from '../services/api/casesApi';
import { caseActions, useCaseState } from '../store/caseStore';
import type { Banner } from '../features/sectionProps';
import { useAuth } from '../features/auth/AuthProvider';
import { useCasePersistence } from '../features/persistence/useCasePersistence';
import { D1D2Section } from '../features/d1d2/D1D2Section';
import { D3Section } from '../features/d3/D3Section';
import { D4Section } from '../features/d4/D4Section';
import { D5Section } from '../features/d5/D5Section';
import { D6Section } from '../features/d6/D6Section';
import { D7Section } from '../features/d7/D7Section';
import { D8Section } from '../features/d8/D8Section';
import { EfficacySection } from '../features/efficacy/EfficacySection';
import { EfficacyReportTemplate } from '../features/reports/EfficacyReportTemplate';
import { FullReportTemplate } from '../features/reports/FullReportTemplate';
import { ImprovementReportTemplate } from '../features/reports/ImprovementReportTemplate';
import { SetupSection } from '../features/setup/SetupSection';
import { translatorFor } from '../i18n';
import { SaveStatusBadge } from '../shared/components/SaveStatusBadge';
import { TutorialModal } from '../shared/components/TutorialModal';
import { WarningModal } from '../shared/components/WarningModal';
import { INITIAL_STATE } from '../shared/constants/initialState';
import { appStylesheets, handleDownloadPDF, printWindowAfter } from '../shared/utils/print';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SETUP);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const state = useCaseState();
  const { user, logout } = useAuth();
  const { status: saveStatus, ready: caseReady } = useCasePersistence(user!, state, caseActions.replaceCase);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);

  const handleAcceptWarning = () => {
    setWarningAccepted(true);
  };

  const handleDeclineWarning = () => {
    // No longer using alert, handled inside WarningModal
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const lang = state?.language || 'es';
  const t = useMemo(() => translatorFor(lang), [lang]);

  const exportProject = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const caseSafeName = state.setup.caseName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'Proyecto_Sin_Nombre';
    const exportFileDefaultName = `Proyecto_8D_${caseSafeName}_${(() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; })()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          // El backend valida la estructura y migra archivos de versiones anteriores.
          const migratedState = await casesApi.normalize(json);
          caseActions.replaceCase(migratedState);
          alert(t('successLoad'));
        } catch (error) {
          alert(t('errorLoad'));
        }
      };
    }
  };

  const handleDownloadPDF = (elementId: string, title: string) => {
    const printElement = document.getElementById(elementId);
    if (!printElement) return;

    const printWindow = window.open('', '', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title} - ${state.setup.caseName || 'Reporte'}</title>
            ${appStylesheets()}
            <style>
              @media print {
                .page-break { page-break-before: always; }
                body { padding: 0; margin: 0; }
              }
              body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
              .industrial-card { border: 1px solid #e2e8f0; border-radius: 1.5rem; padding: 1.5rem; background-color: #ffffff; margin-bottom: 1.5rem; }
            </style>
          </head>
          <body class="p-8 bg-white text-slate-900">
            ${printElement.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindowAfter(printWindow, 600, 'immediate');
    } else {
      window.print();
    }
  };

  const toggleLanguage = () => {
    caseActions.toggleLanguage();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const exportToCSV = () => {
    const data: any[][] = [
      ["REPORTE ESTRUCTURADO 8D - ANÁLISIS DE CAUSA RAÍZ"],
      ["Generado el:", new Date().toLocaleString()],
      [],
      ["DISCIPLINA", "SECCIÓN", "CAMPO", "VALOR"]
    ];

    // D0 Setup
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('startDate'), state.setup.startDate]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('caseName'), state.setup.caseName]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('responsible'), state.setup.responsible]);
    data.push(["D0: CONFIGURACIÓN", "INFORMACIÓN GENERAL", t('caseType'), state.setup.type]);
    data.push(["D0: CONFIGURACIÓN", "REQUISITOS", `${t('impacts')}/${t('standards')}`, (state.setup.impact || state.setup.standards || []).join(' | ')]);

    // D1/D2 Definition
    data.push(["D1/D2: DEFINICIÓN", "FENOMENOLOGÍA", t('phenomenology'), state.d2.phenomenon]);
    if (state.d2.fiveW2H) {
      Object.entries(state.d2.fiveW2H).forEach(([k, v]) => {
        data.push(["D1/D2: DEFINICIÓN", "5W2H", k.toUpperCase(), String(v)]);
      });
    }

    // Financial
    data.push(["D1/D2: DEFINICIÓN", "IMPACTO FINANCIERO", "PÉRDIDA TOTAL", `${state.costs.totalLoss} ${state.costs.currency}`]);
    (state.costs.breakdown || []).forEach(b => {
      data.push(["D1/D2: DEFINICIÓN", "DETALLE COSTOS", b.category, `${b.estimated_value} | ${b.impact_description}`]);
    });

    // D3 Correction
    if (state.d3.isNotApplicable) {
      data.push(["D3: CORRECCIÓN", "NO APLICA", "DETALLE", "No aplica para este caso"]);
    } else {
      const selectedActions = state.d3.selectedCorrectiveActionIds.length > 0 
        ? state.d3.correctiveActions.filter(a => state.d3.selectedCorrectiveActionIds.includes(a.id)) 
        : [];
      
      if (selectedActions.length > 0) {
        selectedActions.forEach((action, idx) => {
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "DESCRIPCIÓN", action.action]);
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "RESPONSABLE", action.responsible]);
          data.push([`D3: CORRECCIÓN (${idx + 1})`, "ACCIÓN SELECCIONADA", "FECHA", action.implementationDate]);
        });
      } else {
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "DESCRIPCIÓN", '']);
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "RESPONSABLE", '']);
        data.push(["D3: CORRECCIÓN", "ACCIÓN SELECCIONADA", "FECHA", '']);
      }
      data.push(["D3: CORRECCIÓN", "PLAN DE IMPLEMENTACIÓN", "DETALLE", state.d3.implementationPlan]);
    }

    // D4 RCA
    data.push(["D4: CAUSA RAÍZ", "ISHIKAWA", t('ishikawaSummary'), state.d4.hypotheses.filter(h => state.d4.selectedHypotheses.includes(h.id)).map(h => `[${h.category}] ${h.text}`).join(' | ')]);
    data.push(["D4: CAUSA RAÍZ", "PLAN EXPERIMENTAL", t('expSummary'), state.d4.verificationPlan]);
    data.push(["D4: CAUSA RAÍZ", "CAUSAS CONFIRMADAS", "LISTADO", state.d4.experimentalConfirmedCauses.map(id => state.d4.gembaDiagnostics.find(d => d.hypothesisId === id)?.cause || id).join(' | ')]);
    data.push(["D4: CAUSA RAÍZ", "MODO DE FALLA", t('unifiedFailure'), state.d4.syntheticCause?.text || state.d4.finalCause]);

    (state.d4.fiveWhysHistory || []).forEach((h, idx) => {
      data.push(["D4: CAUSA RAÍZ", "5 PORQUÉS", `ANÁLISIS ${idx+1}`, h.systemicRootCause]);
    });

    // D5 ACP
    (state.d5_d6.acpPlans || []).forEach(p => {
      p.actions.filter(a => a.isFixed).forEach(a => {
        data.push(["D5: GESTIÓN ACP", "ACCIONES FIJADAS", p.title, `${a.action} | RESP: ${a.responsible} | PLAZO: ${a.timeframe}`]);
      });
    });

    // D6 Poka-Yoke
    (state.d5_d6.pokaYokes || []).forEach(py => {
      data.push(["D6: POKA-YOKE", "DISPOSITIVO", py.type, `${py.description} | BENEFICIO: ${py.benefit}`]);
    });

    // Efficacy
    (state.efficacy.protocols || []).forEach((p, idx) => {
      data.push(["VALIDACIÓN EFICACIA", `PROTOCOLO ${idx+1}`, p.action, `${p.verificationMethod} | KPI: ${p.kpi} | FREQ: ${p.auditFrequency}`]);
    });

    // D7 A3
    if (state.d7.a3Report) {
      data.push(["D7: ESTÁNDARES", "RESUMEN A3", "JUSTIFICACIÓN FINANCIERA", state.d7.a3Report.financialJustification]);
      data.push(["D7: ESTÁNDARES", "RESUMEN A3", "EVALUACIÓN DE RIESGOS", state.d7.a3Report.risks]);
    }

    // D8 Standards
    data.push(["D8: REPORTE A3", "POE", "RESUMEN", state.d8.poe]);
    data.push(["D8: REPORTE A3", "YOKOTEN", "DESPLIEGUE", state.d8.yokoTen]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte 8D");
    ws['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 80 }];
    XLSX.writeFile(wb, `Reporte_Full_8D_${state.setup.caseName || 'Proyecto'}.xlsx`);
  };

  if (!caseReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-200">
        <div className="flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest">
          <ArrowPathIcon className="w-5 h-5 animate-spin" /> {t('loadingCase')}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-200">
      {!warningAccepted && (
        <WarningModal 
          onAccept={handleAcceptWarning} 
          onDecline={handleDeclineWarning} 
          t={t} 
          lang={lang}
          onToggleLanguage={toggleLanguage}
        />
      )}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm">
        <div className="py-3 px-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-900 rounded-lg shadow-md"><BuildingOffice2Icon className="w-5 h-5 text-white" /></div>
            <div className="leading-tight">
              <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none mb-0.5">{t('suiteName')}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('suiteSubtitle')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-grow py-2 px-2.5 space-y-0.5 overflow-y-auto custom-scroll">
          {[
            { id: Tab.SETUP, label: t('setup'), icon: AdjustmentsHorizontalIcon },
            { id: Tab.D1_D2, label: t('d1d2'), icon: MagnifyingGlassIcon },
            { id: Tab.D3, label: t('d3'), icon: ShieldCheckIcon },
            { id: Tab.D4, label: t('d4'), icon: ClipboardDocumentCheckIcon },
            { id: Tab.D5, label: t('d5'), icon: WrenchScrewdriverIcon },
            { id: Tab.D6, label: t('d6'), icon: LightBulbIcon },
            { id: Tab.D7, label: t('d7'), icon: ArrowPathIcon },
            { id: Tab.D8, label: t('d8'), icon: CheckBadgeIcon },
            { id: Tab.EFFICACY, label: t('efficacyValidation'), icon: ShieldCheckIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all uppercase tracking-wider text-left ${
                activeTab === item.id ? 'sidebar-item-active shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="flex-1 text-left leading-tight truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 space-y-1.5">
          <button onClick={() => setShowTutorial(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-100 border border-blue-100">
            <BookOpenIcon className="w-3.5 h-3.5" /> {t('tutorial')}
          </button>
          <button onClick={toggleLanguage} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]">
             {t('cambiarAEspaOl')}
          </button>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-0.5 px-1">{t('projectMgmt')}</p>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={exportProject} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowDownTrayIcon className="w-3.5 h-3.5 text-blue-600" /> {t('save')}</button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowUpTrayIcon className="w-3.5 h-3.5 text-orange-600" /> {t('load')}</button>
            <input type="file" ref={fileInputRef} onChange={importProject} accept=".json" className="hidden" />
          </div>
          <button onClick={exportToCSV} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 border border-slate-200 active:scale-[0.98]">
            <CloudArrowDownIcon className="w-3.5 h-3.5" /> {t('csvReport')}
          </button>
          <button onClick={() => handleDownloadPDF('full-report-print', t('fullReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm active:scale-[0.98]">
            <DocumentIcon className="w-3.5 h-3.5" /> {t('pdfFullReport')}
          </button>
          <button onClick={() => handleDownloadPDF('efficacy-report-print', t('pdfEfficacyReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-sm active:scale-[0.98]">
            <CheckBadgeIconSolid className="w-3.5 h-3.5" /> {t('pdfEfficacyReport')}
          </button>
          <button onClick={() => handleDownloadPDF('improvement-report-print', 'PDF REPORTE OPORTUNIDAD DE MEJORA')} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-sm active:scale-[0.98]">
            <SparklesIcon className="w-3.5 h-3.5" /> PDF REPORTE OPORTUNIDAD DE MEJORA
          </button>
        </div>
      </aside>
      <main className="flex-grow flex flex-col min-w-0" id="main-content-scroll">
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-10 bg-white border-b border-slate-200">
           <div className="flex items-center gap-3"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('scientificMethod')}</span><div className="h-4 w-px bg-slate-200"></div><span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{t('aiConnected')}</span></div>
           <div className="flex items-center gap-4">
             <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group" title={t('fullScreen')}>
                {isFullscreen ? <ArrowsPointingInIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" /> : <ArrowsPointingOutIcon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />}
             </button>
             <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> {t('wcmActive')}</div>
             <SaveStatusBadge status={saveStatus} lang={lang} />
             <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[160px]" title={user?.username}>{user?.displayName}</span>
               <button onClick={() => void logout()} className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                 {t('signOut')}
               </button>
             </div>
           </div>
        </header>
        <div className="flex-grow overflow-y-auto p-12 custom-scroll bg-slate-200/40">
          <div className="max-w-7xl mx-auto">
            {activeTab === Tab.SETUP && <SetupSection setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D1_D2 && <D1D2Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D3 && <D3Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D4 && <D4Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D5 && <D5Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D6 && <D6Section t={t} setBanner={setBanner} />}
            {activeTab === Tab.D7 && <D8Section t={t} setBanner={setBanner} />}
            {activeTab === Tab.D8 && <D7Section t={t} setBanner={setBanner} />}
            {activeTab === Tab.EFFICACY && <EfficacySection t={t} setBanner={setBanner} />}
          </div>
        </div>
        <div id="full-report-print" className="hidden"><FullReportTemplate state={state} t={t} /></div>
        <div id="efficacy-report-print" className="hidden"><EfficacyReportTemplate state={state} t={t} /></div>
        <div id="improvement-report-print" className="hidden"><ImprovementReportTemplate state={state} t={t} /></div>
        <TutorialModal 
          isOpen={showTutorial} 
          onClose={() => setShowTutorial(false)} 
          t={t} 
          step={tutorialStep} 
          setStep={setTutorialStep} 
        />
        {banner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl ${
              banner.title?.toLowerCase().includes('d4') || 
              banner.title?.toLowerCase().includes('análisis forense') || 
              banner.title?.toLowerCase().includes('analisis forense') || 
              banner.title?.toLowerCase().includes('causa raíz') || 
              banner.title?.toLowerCase().includes('causa raiz') || 
              banner.title?.toLowerCase().includes('d0') || 
              banner.title?.toLowerCase().includes('configuración') || 
              banner.title?.toLowerCase().includes('configuracion')
                ? 'max-w-[1272px] max-h-[770px]' 
                : 'max-w-2xl max-h-[500px]'
            } w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col`}>
              <div className="bg-amber-500 p-4 flex items-center gap-4">
                <div className="p-2 bg-white/20 rounded-xl">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">{banner.title}</h3>
                  <p className="text-xs font-bold text-amber-100 uppercase tracking-widest">{t('tutorialSubtitle')}</p>
                </div>
              </div>
              <div className="p-8 overflow-y-auto custom-scroll">
                <p className="text-slate-600 font-medium leading-relaxed text-base mb-6">
                  {banner.content}
                </p>
                <button 
                  onClick={() => setBanner(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-[0.95]"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

export default App;
