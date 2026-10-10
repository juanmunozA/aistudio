import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from '../types';
import en from './locales/en.json';
import es from './locales/es.json';

// Diccionarios por idioma: el español es el idioma base y respaldo de las claves faltantes.
void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: 'es',
  fallbackLng: 'es',
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});

export type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/** Traductor fijo para un idioma: se usa con el idioma guardado en el caso. */
export const translatorFor = (language: Language): TranslateFn => i18n.getFixedT(language) as TranslateFn;

export default i18n;
