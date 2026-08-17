import { useStore } from './store';
import { translate, type StringKey } from './i18n';

/**
 * Translation hook. `t('tabBoard')` returns the string in the active language.
 * Components re-render automatically when the language changes because `lang`
 * is read from the store.
 */
export function useT() {
  const lang = useStore((s) => s.lang);
  const t = (key: StringKey) => translate(key, lang);
  t.lang = lang;
  t.isRtl = lang === 'ar';
  return t;
}

/** Locale tag for Intl formatting. */
export function localeOf(lang: string) {
  return lang === 'ar' ? 'ar' : 'en-GB';
}
