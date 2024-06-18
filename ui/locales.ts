import 'server-only';

import { merge } from 'lodash';

import type { Locale } from './i18n-config';
import FallbackLocale from './locales/en.json';

const dictionaries = {
  default: () => import('./locales/en.json').then((module) => module.default),
};

/**
 * Bind API locale here
 */
export const getLocale = async (locale: Locale) => {
  const defaultDict = await dictionaries.default();
  const lang = locale.split('-')[0];
  if (lang in dictionaries) {
    return merge({}, defaultDict);
  }

  return defaultDict;
};

export type TLocale = typeof FallbackLocale;

export const DefaultLocale: TLocale = FallbackLocale;
