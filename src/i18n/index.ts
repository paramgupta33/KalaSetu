import { Language } from '../types';
import { I18NKey } from './types';
import { I18N_EN } from './locales/en';
import { I18N_HI } from './locales/hi';
import { I18N_MR } from './locales/mr';
import { I18N_BN } from './locales/bn';
import { I18N_TA } from './locales/ta';
import { I18N_TE } from './locales/te';
import { I18N_GU } from './locales/gu';
import { I18N_KN } from './locales/kn';
import { I18N_ML } from './locales/ml';
import { I18N_OR } from './locales/or';
import { I18N_PA } from './locales/pa';
import { I18N_AS } from './locales/as';
import { I18N_UR } from './locales/ur';
import { I18N_SA } from './locales/sa';
import { I18N_BHO } from './locales/bho';

export * from './types';
export * from './languages';

export const I18N_DICTIONARIES: Record<Language, Partial<Record<I18NKey, string>>> = {
  en: I18N_EN,
  hi: I18N_HI,
  mr: I18N_MR,
  bn: I18N_BN,
  ta: I18N_TA,
  te: I18N_TE,
  gu: I18N_GU,
  kn: I18N_KN,
  ml: I18N_ML,
  or: I18N_OR,
  pa: I18N_PA,
  as: I18N_AS,
  ur: I18N_UR,
  sa: I18N_SA,
  bho: I18N_BHO,
};

export const getTranslation = (lang: Language, key: I18NKey): string => {
  const dict = I18N_DICTIONARIES[lang] || I18N_DICTIONARIES.en;
  return (dict && dict[key]) || I18N_DICTIONARIES.hi[key] || I18N_DICTIONARIES.en[key] || (key as string);
};
