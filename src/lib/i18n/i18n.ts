import { derived, writable } from 'svelte/store';
import translations from './translations';

export type Locale = keyof typeof translations;

export const locale = writable<Locale>('en');
export const locales = Object.keys(translations) as Locale[];

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
