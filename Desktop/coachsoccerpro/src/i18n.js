import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enCoach from './locales/en/coach.json';
import enParent from './locales/en/parent.json';
import enChild from './locales/en/child.json';
import enBadges from './locales/en/badges.json';
import enProhabits from './locales/en/prohabits.json';

import esCommon from './locales/es/common.json';
import esCoach from './locales/es/coach.json';
import esParent from './locales/es/parent.json';
import esChild from './locales/es/child.json';
import esBadges from './locales/es/badges.json';
import esProhabits from './locales/es/prohabits.json';

const resources = {
  en: {
    common: enCommon,
    coach: enCoach,
    parent: enParent,
    child: enChild,
    badges: enBadges,
    prohabits: enProhabits,
  },
  es: {
    common: esCommon,
    coach: esCoach,
    parent: esParent,
    child: esChild,
    badges: esBadges,
    prohabits: esProhabits,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'coach', 'parent', 'child', 'badges', 'prohabits'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
