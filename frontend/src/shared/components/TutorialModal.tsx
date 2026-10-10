import { ClipboardDocumentCheckIcon, ShieldCheckIcon, MagnifyingGlassIcon, WrenchScrewdriverIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, CloudArrowDownIcon, CheckBadgeIcon, LightBulbIcon, SparklesIcon, StarIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export const TutorialModal = ({ isOpen, onClose, t, step, setStep }: any) => {
  if (!isOpen) return null;

  const steps = [
    { title: t('tutRulesTitle'), content: t('tutRulesContent'), icon: StarIcon, color: 'bg-amber-500', pro: t('tutRulesPro'), points: [t('scientificMethod'), t('aiConnected'), t('wcmActive')] },
    { title: t('tutD0Title'), content: t('tutD0Content'), icon: AdjustmentsHorizontalIcon, color: 'bg-blue-500', pro: t('tutD0Pro'), points: [t('startDate'), t('caseName'), t('caseType')] },
    { title: t('tutD1D2Title'), content: t('tutD1D2Content'), icon: MagnifyingGlassIcon, color: 'bg-indigo-500', pro: t('tutD1D2Pro'), points: [t('phenomenology'), t('finImpact'), '5W2H'] },
    { title: t('tutD3Title'), content: t('tutD3Content'), icon: ShieldCheckIcon, color: 'bg-slate-700', pro: t('tutD3Pro'), points: [t('correctiveActionTitle'), t('implementationPlan'), t('fix')] },
    { title: t('tutD4Title'), content: t('tutD4Content'), icon: ClipboardDocumentCheckIcon, color: 'bg-rose-500', pro: t('tutD4Pro'), points: [t('ishikawaTitle'), t('floorValidation'), t('pursuitWhys')] },
    { title: t('tutD5Title'), content: t('tutD5Content'), icon: WrenchScrewdriverIcon, color: 'bg-emerald-500', pro: t('tutD5Pro'), points: [t('eliminateRoot'), t('materializePlans'), t('responsible')] },
    { title: t('tutD6Title'), content: t('tutD6Content'), icon: LightBulbIcon, color: 'bg-orange-500', pro: t('tutD6Pro'), points: [t('preventionDesign'), t('viewGuide'), 'Poka-Yoke'] },
    { title: t('tutD7Title'), content: t('tutD7Content'), icon: ArrowPathIcon, color: 'bg-cyan-500', pro: t('tutD7Pro'), points: [t('standardPOE'), t('yokotenTab'), t('certification')] },
    { title: t('tutD8Title'), content: t('tutD8Content'), icon: CheckBadgeIcon, color: 'bg-violet-500', pro: t('tutD8Pro'), points: [t('execReportA3'), t('fullReport'), 'PDF Export'] },
    { title: t('tutEfficacyTitle'), content: t('tutEfficacyContent'), icon: ShieldCheckIcon, color: 'bg-emerald-600', pro: t('tutEfficacyPro'), points: [t('verificationMethod'), t('kpi'), t('auditFrequency')] },
    { title: t('dataMgmt'), content: t('tutDataContent'), icon: CloudArrowDownIcon, color: 'bg-slate-900', pro: t('tutDataPro'), points: [t('save'), t('load'), t('resetSection')] }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[600px] animate-scale-up">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-6">
            <div className={`p-3 rounded-xl shadow-lg ${current.color}`}><current.icon className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{t('tutorialTitle')}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('tutorialSubtitle')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-8 custom-scroll">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">{t('methodology')}</div>
              <h3 className="text-xl font-black text-slate-900 leading-none tracking-tighter">{current.title}</h3>
              <p className="text-base font-medium text-slate-600 leading-relaxed">{current.content}</p>
            </div>
            <div className={`rounded-[2rem] p-6 border transition-all duration-500 ${current.color.replace('bg-', 'bg-opacity-5 border-').replace('500', '100').replace('700', '100').replace('900', '100')} space-y-4`}>
              <div className="flex items-center gap-3 mb-1">
                <SparklesIcon className={`w-5 h-5 ${current.color.replace('bg-', 'text-')}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${current.color.replace('bg-', 'text-')}`}>{t('operationPro')}</span>
              </div>
              <div className="space-y-3">
                {current.points.map((point: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 flex-shrink-0">{idx + 1}</div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed uppercase tracking-wider">{point}</p>
                  </div>
                ))}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <div className={`p-1.5 rounded-lg shadow-md ${current.color}`}><LightBulbIcon className="w-5 h-5 text-white" /></div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('proTip')}</p>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{current.pro}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-10 bg-blue-600' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex gap-4">
            <button 
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${step === 0 ? 'opacity-30 cursor-not-allowed' : 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-100'}`}
            >
              <ChevronLeftIcon className="w-6 h-6" /> {t('prev')}
            </button>
            <button 
              onClick={() => step === steps.length - 1 ? onClose() : setStep(step + 1)}
              className="flex items-center gap-3 px-10 py-3 bg-slate-900 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-[0.95]"
            >
              {step === steps.length - 1 ? t('close') : t('next')} <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
