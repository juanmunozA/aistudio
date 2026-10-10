import { type SaveStatus } from '../../features/persistence/useCasePersistence';

export const SAVE_STATUS_TEXT: Record<SaveStatus, { es: string; en: string; className: string }> = {
  loading: { es: 'Cargando', en: 'Loading', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  saved: { es: 'Guardado', en: 'Saved', className: 'bg-slate-50 text-slate-500 border-slate-200' },
  pending: { es: 'Cambios sin guardar', en: 'Unsaved changes', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  saving: { es: 'Guardando...', en: 'Saving...', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  offline: { es: 'Sin conexión: guardado local', en: 'Offline: saved locally', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  error: { es: 'Error al guardar', en: 'Save error', className: 'bg-red-50 text-red-700 border-red-100' },
};

export const SaveStatusBadge = ({ status, lang }: { status: SaveStatus; lang: 'es' | 'en' }) => {
  const config = SAVE_STATUS_TEXT[status];
  return (
    <div className={`px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest ${config.className}`}>
      {config[lang]}
    </div>
  );
};
