import type { App } from 'vue';
import { createI18n } from 'vue-i18n';
import { localStg } from '@/utils/storage';
import messages from './locale';

const i18n = createI18n({
  locale: localStg.get('lang') || 'zh-CN',
  fallbackLocale: 'en',
  messages,
  legacy: false
});

/**
 * Setup plugin i18n
 *
 * @param app
 */
export function setupI18n(app: App) {
  app.use(i18n);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const $t = i18n.global.t as (key: string, options?: any) => string;

export function setLocale(locale: App.I18n.LangType) {
  i18n.global.locale.value = locale;
}
