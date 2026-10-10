import type { TranslateFn } from '../i18n';
import type { Tab } from '../types';

export interface Banner {
  title: string;
  content: string;
}

/** Props comunes de las vistas de cada disciplina: el estado y la IA se leen del store. */
export interface SectionProps {
  t: TranslateFn;
  setBanner: (banner: Banner | null) => void;
  setActiveTab?: (tab: Tab) => void;
}
