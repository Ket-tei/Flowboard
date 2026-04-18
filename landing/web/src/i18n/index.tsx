import i18n from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import type { ReactNode } from "react";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: navigator.language.startsWith("en") ? "en" : "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function I18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export { i18n };
