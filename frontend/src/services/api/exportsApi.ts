import type { AppState } from '../../types';
import { apiDownload } from './httpClient';

export type ExcelExport = 'full-report' | 'gemba-checklist' | 'acp-plan';

/** El backend genera el Excel del reporte con los datos del caso. */
export const exportsApi = {
  downloadExcel: (type: ExcelExport, state: AppState) =>
    apiDownload(`/exports/${type}`, { state, generatedAt: new Date().toLocaleString() }, `${type}.xlsx`),
};
