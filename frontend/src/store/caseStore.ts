import { create } from 'zustand';
import type { AppState, Language } from '../types';
import { INITIAL_STATE } from '../shared/constants/initialState';

/** Disciplinas del caso: cada una es un slice independiente del estado. */
export type CaseSection = Exclude<keyof AppState, 'language'>;

type Updater<T> = T | ((previous: T) => T);

const resolve = <T,>(updater: Updater<T>, previous: T): T =>
  typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater;

interface CaseStore {
  /** Estado completo del análisis (lo que se guarda en el servidor y se exporta en JSON). */
  caseState: AppState;
  /** Operación de IA en curso (clave de la acción que la disparó). */
  loadingKey: string | null;

  /** Reemplaza el caso completo: carga desde el servidor, copia local o importación de JSON. */
  replaceCase: (state: AppState) => void;
  /** Actualiza una disciplina sin tocar las demás. */
  updateSection: <K extends CaseSection>(section: K, updater: Updater<AppState[K]>) => void;
  /** Deja una disciplina como en un caso nuevo. */
  resetSection: (section: CaseSection) => void;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  /** Para cambios que afectan varias disciplinas a la vez (por ejemplo, reiniciar etapas). */
  updateCase: (updater: (previous: AppState) => AppState) => void;
  setLoadingKey: (key: string | null) => void;
}

export const useCaseStore = create<CaseStore>()((set) => ({
  caseState: INITIAL_STATE,
  loadingKey: null,

  replaceCase: (state) => set({ caseState: state }),
  updateSection: (section, updater) =>
    set((store) => ({ caseState: { ...store.caseState, [section]: resolve(updater, store.caseState[section]) } })),
  resetSection: (section) => set((store) => ({ caseState: { ...store.caseState, [section]: INITIAL_STATE[section] } })),
  setLanguage: (language) => set((store) => ({ caseState: { ...store.caseState, language } })),
  toggleLanguage: () =>
    set((store) => ({ caseState: { ...store.caseState, language: store.caseState.language === 'es' ? 'en' : 'es' } })),
  updateCase: (updater) => set((store) => ({ caseState: updater(store.caseState) })),
  setLoadingKey: (loadingKey) => set({ loadingKey }),
}));

/** Estado completo del caso (para vistas que leen varias disciplinas). */
export const useCaseState = () => useCaseStore((store) => store.caseState);

/** Una disciplina del caso. */
export const useSection = <K extends keyof AppState>(section: K) => useCaseStore((store) => store.caseState[section]);

/** Acciones del store (referencias estables, no provocan renders). */
export const caseActions = {
  replaceCase: (state: AppState) => useCaseStore.getState().replaceCase(state),
  updateSection: <K extends CaseSection>(section: K, updater: Updater<AppState[K]>) =>
    useCaseStore.getState().updateSection(section, updater),
  resetSection: (section: CaseSection) => useCaseStore.getState().resetSection(section),
  setLanguage: (language: Language) => useCaseStore.getState().setLanguage(language),
  toggleLanguage: () => useCaseStore.getState().toggleLanguage(),
  updateCase: (updater: (previous: AppState) => AppState) => useCaseStore.getState().updateCase(updater),
  getCase: () => useCaseStore.getState().caseState,
};
