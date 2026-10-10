import type { AppState } from '../types';
import { localToday } from './api/aiApi';
import { casesApi } from './api/casesApi';

/** Descarga el proyecto completo en JSON (respaldo portable del caso). */
export function downloadProjectFile(state: AppState) {
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const safeName = state.setup.caseName.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'Proyecto_Sin_Nombre';
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', `Proyecto_8D_${safeName}_${localToday()}.json`);
  link.click();
}

/** Lee un proyecto JSON; el backend valida la estructura y migra versiones anteriores. */
export async function readProjectFile(file: File): Promise<AppState> {
  const json: unknown = JSON.parse(await file.text());
  return casesApi.normalize(json);
}
