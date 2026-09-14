/**
 * ONE language for the whole app. Every page's EN/ES toggle reads and
 * writes the global i18n language (persisted in localStorage), so flipping
 * it anywhere flips the sidebar, every page, and survives reload.
 */
import { useTranslation } from "react-i18next";

export function useLang() {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "en").startsWith("es") ? "es" : "en";
  const setLang = (l) => i18n.changeLanguage(l);
  return [lang, setLang];
}
