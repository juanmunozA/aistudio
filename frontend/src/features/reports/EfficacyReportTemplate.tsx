import { type AppState } from '../../types';
import { BuildingOffice2Icon } from '@heroicons/react/24/outline';

export const EfficacyReportTemplate = ({ state, t }: { state: AppState, t: any }) => {
  return (
    <div id="efficacy-report-content" className="p-12 bg-white text-slate-900 font-sans max-w-[1000px] mx-auto">
      <div className="flex justify-between items-start mb-12 border-b-4 border-slate-900 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{t('pdfEfficacyReport')}</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('scientificMethod')} • {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-4 py-2 inline-block">
            <span className="text-[10px] font-black uppercase tracking-widest">ID: {state.setup.caseName || 'UNSET'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 mb-12">
        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('setup')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('caseName')}</label>
              <p className="font-bold text-sm uppercase">{state.setup.caseName}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('responsible')}</label>
              <p className="font-bold text-sm uppercase">{state.setup.responsible}</p>
            </div>
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('phenomenology')}</h2>
          <p className="text-sm font-bold text-slate-700 leading-relaxed">{state.d2.phenomenon}</p>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('rootCauses')}</h2>
          <div className="space-y-4">
            {state.d4.fiveWhysHistory.map((h, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border-l-4 border-slate-900">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Causa Raíz Sistémica {idx + 1}</p>
                <p className="text-sm font-bold text-slate-800">{h.systemicRootCause}</p>
              </div>
            ))}
            {state.d4.fiveWhysHistory.length === 0 && (
              <p className="text-sm italic text-slate-400">No se han identificado causas raíz sistémicas aún.</p>
            )}
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('efficacyValidationPlan')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[8%]">{t('actionId')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[18%]">{t('action')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationMethod')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('kpi')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('auditFrequency')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[14%]">{t('contingencyPlan')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionResponsible')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('executionDate')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.efficacy.protocols.map((p, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words whitespace-pre-line leading-tight">{p.id}</td>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words">{p.action}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationMethod}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.kpi}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.auditFrequency}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.contingencyPlan}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.executionResponsible}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.executionDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="industrial-card">
          <h2 className="text-xl font-black uppercase border-b-2 border-slate-200 pb-3 mb-6">{t('efficacyVerification')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[10%]">{t('actionId')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[40%]">{t('action')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[20%]">{t('verificationResponsible')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('verificationDate')}</th>
                  <th className="p-2 text-[7px] font-black text-slate-500 uppercase tracking-widest w-[15%]">{t('effective')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.efficacy.protocols.map((p, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words whitespace-pre-line leading-tight">{p.id}</td>
                    <td className="p-2 text-[8px] font-bold text-slate-700 break-words">{p.action}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationResponsible}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words">{p.verificationDate}</td>
                    <td className="p-2 text-[8px] text-slate-600 break-words font-black">{p.isEffective || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-16 pt-6 border-t border-slate-100 flex justify-between items-center opacity-30 grayscale">
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="w-5 h-5"/>
          <span className="text-[10px] font-black uppercase tracking-widest">{t('suiteName')}</span>
        </div>
        <p className="text-[9px] font-bold uppercase">{t('scientificMethod')}</p>
      </div>
    </div>
  );
};
