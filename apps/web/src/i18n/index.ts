import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import fr from "./locales/fr.json";

const STORAGE_KEY = "flowboard_lang";

export function getStoredLanguage(): string {
  if (typeof window === "undefined") return "fr";
  return localStorage.getItem(STORAGE_KEY) ?? "fr";
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: getStoredLanguage(),
  fallbackLng: "fr",
  interpolation: { escapeValue: false },
});

export function setAppLanguage(lng: string): void {
  localStorage.setItem(STORAGE_KEY, lng);
  void i18n.changeLanguage(lng);
}

export default i18n;
