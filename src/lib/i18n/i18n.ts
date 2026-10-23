import { derived, writable } from 'svelte/store';
import translations from './translations';
import { localizeServerMessage } from './messages';

export type Locale = keyof typeof translations;

export const locale = writable<Locale>('en');
export const locales = Object.keys(translations) as Locale[];

export const LOCALE_COOKIE = 'locale';

export function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && value in translations;
}

/** The saved choice, else the browser's preferred language, else English. */
export function pickLocale(saved: string | undefined, acceptLanguage: string | null): Locale {
	if (isLocale(saved)) return saved;
	for (const part of (acceptLanguage ?? '').split(',')) {
		const language = part.split(';')[0].trim().slice(0, 2).toLowerCase();
		if (isLocale(language)) return language;
	}
	return 'en';
}

/** Remembers the language for later visits and server-rendered pages. */
export function saveLocale(value: Locale) {
	locale.set(value);
	document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
}

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/** Variables can contain user input (names, emails), so they are escaped before insertion. */
export function escapeHtml(value: unknown): string {
	return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export function translate(locale: Locale, key: string, vars: Record<string, unknown> = {}): string {
	if (!key) throw new Error('no key provided to $t()');

	let text: string | undefined = (translations[locale] as Record<string, string>)[key];
	if (!text) throw new Error(`no translation found for ${locale}.${key}`);

	for (const [name, value] of Object.entries(vars)) {
		text = text.replaceAll(`{{${name}}}`, escapeHtml(value));
	}

	return text;
}

export const t = derived(
	locale,
	($locale) =>
		(key: string, vars: Record<string, unknown> = {}) =>
			translate($locale, key, vars)
);

/** Server messages are written in English; this shows them in the chosen language. */
export const msg = derived(
	locale,
	($locale) => (message: string | null | undefined) =>
		message ? localizeServerMessage($locale, message) : ''
);
