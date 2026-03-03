export const locales = [
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru',
    'zh', 'ja', 'ko', 'ar', 'he', 'hi', 'bn', 'tr', 'vi',
    'th', 'id', 'pl', 'sv'
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const rtlLocales: Locale[] = ['ar', 'he'];

export function isRtl(locale: Locale): boolean {
    return rtlLocales.includes(locale);
}

export async function getMessages(locale: Locale) {
    return (await import(`../messages/${locale}.json`)).default;
}
