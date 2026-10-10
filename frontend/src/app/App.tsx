import React, { useMemo, useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../features/auth/AuthProvider';
import { D1D2Section } from '../features/d1d2/D1D2Section';
import { D3Section } from '../features/d3/D3Section';
import { D4Section } from '../features/d4/D4Section';
import { D5Section } from '../features/d5/D5Section';
import { D6Section } from '../features/d6/D6Section';
import { D7Section } from '../features/d7/D7Section';
import { D8Section } from '../features/d8/D8Section';
import { EfficacySection } from '../features/efficacy/EfficacySection';
import { useCasePersistence } from '../features/persistence/useCasePersistence';
import { EfficacyReportTemplate } from '../features/reports/EfficacyReportTemplate';
import { FullReportTemplate } from '../features/reports/FullReportTemplate';
import { ImprovementReportTemplate } from '../features/reports/ImprovementReportTemplate';
import type { Banner } from '../features/sectionProps';
import { SetupSection } from '../features/setup/SetupSection';
import { translatorFor } from '../i18n';
import { exportsApi } from '../services/api/exportsApi';
import { downloadProjectFile, readProjectFile } from '../services/projectFile';
import { TutorialModal } from '../shared/components/TutorialModal';
import { WarningModal } from '../shared/components/WarningModal';
import { printCaseReport } from '../shared/utils/print';
import { caseActions, useCaseState } from '../store/caseStore';
import { Tab } from '../types';
import { AppHeader } from './layout/AppHeader';
import { HelpBanner } from './layout/HelpBanner';
import { Sidebar } from './layout/Sidebar';

const showError = (error: unknown) => alert(error instanceof Error ? error.message : String(error));

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SETUP);
  const state = useCaseState();
  const { user, logout } = useAuth();
  const { status: saveStatus, ready: caseReady } = useCasePersistence(user!, state, caseActions.replaceCase);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);

  const lang = state?.language || 'es';
  const t = useMemo(() => translatorFor(lang), [lang]);

  const loadProject = async (file: File) => {
    try {
      caseActions.replaceCase(await readProjectFile(file));
      alert(t('successLoad'));
    } catch {
      alert(t('errorLoad'));
    }
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
        <WarningModal onAccept={() => setWarningAccepted(true)} onDecline={() => undefined} t={t} lang={lang} onToggleLanguage={caseActions.toggleLanguage} />
      )}
      <Sidebar
        t={t}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTutorial={() => setShowTutorial(true)}
        onToggleLanguage={caseActions.toggleLanguage}
        onSaveProject={() => downloadProjectFile(state)}
        onLoadProject={(file) => void loadProject(file)}
        onExcelReport={() => exportsApi.downloadExcel('full-report', state).catch(showError)}
        onPrintReport={(elementId, title) => printCaseReport(elementId, title, state.setup.caseName)}
      />
      <main className="flex-grow flex flex-col min-w-0" id="main-content-scroll">
        <AppHeader t={t} lang={lang} saveStatus={saveStatus} user={user} onLogout={() => void logout()} />
        <div className="flex-grow overflow-y-auto p-12 custom-scroll bg-slate-200/40">
          <div className="max-w-7xl mx-auto">
            {activeTab === Tab.SETUP && <SetupSection setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D1_D2 && <D1D2Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D3 && <D3Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D4 && <D4Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D5 && <D5Section setActiveTab={setActiveTab} t={t} setBanner={setBanner} />}
            {activeTab === Tab.D6 && <D6Section t={t} setBanner={setBanner} />}
            {/* En la versión original la pestaña D7 muestra la vista de POE/Yoko-Ten y D8 la del reporte A3. */}
            {activeTab === Tab.D7 && <D8Section t={t} setBanner={setBanner} />}
            {activeTab === Tab.D8 && <D7Section t={t} setBanner={setBanner} />}
            {activeTab === Tab.EFFICACY && <EfficacySection t={t} setBanner={setBanner} />}
          </div>
        </div>
        <div id="full-report-print" className="hidden"><FullReportTemplate state={state} t={t} /></div>
        <div id="efficacy-report-print" className="hidden"><EfficacyReportTemplate state={state} t={t} /></div>
        <div id="improvement-report-print" className="hidden"><ImprovementReportTemplate state={state} t={t} /></div>
        <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} t={t} step={tutorialStep} setStep={setTutorialStep} />
        {banner && <HelpBanner banner={banner} t={t} onClose={() => setBanner(null)} />}
      </main>
    </div>
  );
};

export default App;
