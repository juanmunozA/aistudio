import React, { useRef } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  CheckBadgeIcon as CheckBadgeIconSolid,
  ClipboardDocumentCheckIcon,
  CloudArrowDownIcon,
  DocumentIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { TranslateFn } from '../../i18n';
import { Tab } from '../../types';

interface SidebarProps {
  t: TranslateFn;
  activeTab: Tab;
  onSelectTab: (tab: Tab) => void;
  onOpenTutorial: () => void;
  onToggleLanguage: () => void;
  onSaveProject: () => void;
  onLoadProject: (file: File) => void;
  onExcelReport: () => void;
  onPrintReport: (elementId: string, title: string) => void;
}

/** Barra lateral: navegación entre disciplinas y gestión del proyecto. */
export const Sidebar: React.FC<SidebarProps> = ({
  t,
  activeTab,
  onSelectTab,
  onOpenTutorial,
  onToggleLanguage,
  onSaveProject,
  onLoadProject,
  onExcelReport,
  onPrintReport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = [
    { id: Tab.SETUP, label: t('setup'), icon: AdjustmentsHorizontalIcon },
    { id: Tab.D1_D2, label: t('d1d2'), icon: MagnifyingGlassIcon },
    { id: Tab.D3, label: t('d3'), icon: ShieldCheckIcon },
    { id: Tab.D4, label: t('d4'), icon: ClipboardDocumentCheckIcon },
    { id: Tab.D5, label: t('d5'), icon: WrenchScrewdriverIcon },
    { id: Tab.D6, label: t('d6'), icon: LightBulbIcon },
    { id: Tab.D7, label: t('d7'), icon: ArrowPathIcon },
    { id: Tab.D8, label: t('d8'), icon: CheckBadgeIcon },
    { id: Tab.EFFICACY, label: t('efficacyValidation'), icon: ShieldCheckIcon },
  ];

  return (
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
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
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
        <button onClick={onOpenTutorial} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-100 border border-blue-100">
          <BookOpenIcon className="w-3.5 h-3.5" /> {t('tutorial')}
        </button>
        <button onClick={onToggleLanguage} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]">
          {t('cambiarAEspaOl')}
        </button>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest pt-0.5 px-1">{t('projectMgmt')}</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={onSaveProject} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowDownTrayIcon className="w-3.5 h-3.5 text-blue-600" /> {t('save')}</button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-1 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-[0.95]"><ArrowUpTrayIcon className="w-3.5 h-3.5 text-orange-600" /> {t('load')}</button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onLoadProject(file);
            }}
            accept=".json"
            className="hidden"
          />
        </div>
        <button onClick={onExcelReport} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 border border-slate-200 active:scale-[0.98]">
          <CloudArrowDownIcon className="w-3.5 h-3.5" /> {t('csvReport')}
        </button>
        <button onClick={() => onPrintReport('full-report-print', t('fullReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-sm active:scale-[0.98]">
          <DocumentIcon className="w-3.5 h-3.5" /> {t('pdfFullReport')}
        </button>
        <button onClick={() => onPrintReport('efficacy-report-print', t('pdfEfficacyReport'))} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-sm active:scale-[0.98]">
          <CheckBadgeIconSolid className="w-3.5 h-3.5" /> {t('pdfEfficacyReport')}
        </button>
        <button onClick={() => onPrintReport('improvement-report-print', 'PDF REPORTE OPORTUNIDAD DE MEJORA')} className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 shadow-sm active:scale-[0.98]">
          <SparklesIcon className="w-3.5 h-3.5" /> PDF REPORTE OPORTUNIDAD DE MEJORA
        </button>
      </div>
    </aside>
  );
};
