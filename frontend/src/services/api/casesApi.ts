import type { AppState } from '../../types';
import { apiRequest } from './httpClient';

export interface CaseSummary {
  id: string;
  name: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCase extends CaseSummary {
  state: AppState;
}

export const casesApi = {
  list: () => apiRequest<{ cases: CaseSummary[] }>('/cases').then((r) => r.cases),
  get: (id: string) => apiRequest<{ case: StoredCase }>(`/cases/${id}`).then((r) => r.case),
  create: (state: AppState) => apiRequest<{ case: StoredCase }>('/cases', { method: 'POST', body: { state } }).then((r) => r.case),
  update: (id: string, state: AppState, version: number) =>
    apiRequest<{ case: StoredCase }>(`/cases/${id}`, { method: 'PUT', body: { state, version } }).then((r) => r.case),
  /** Valida y migra un proyecto JSON exportado (incluye versiones anteriores). */
  normalize: (state: unknown) =>
    apiRequest<{ state: AppState }>('/cases/normalize', { method: 'POST', body: { state } }).then((r) => r.state),
};
