import { describe, expect, it } from 'vitest';
import { localizeServerMessage } from './messages';
import { pickLocale } from './i18n';

describe('localizeServerMessage', () => {
	it('translates known messages and keeps variables', () => {
		expect(localizeServerMessage('de', 'Server not found.')).toBe('Server nicht gefunden.');
		expect(localizeServerMessage('de', 'Too many login attempts. Try again in 5 minutes.')).toBe(
			'Zu viele Anmeldeversuche. Versuche es in 5 Minuten erneut.'
		);
		expect(localizeServerMessage('de', 'Server password is required.')).toBe(
			'Serverpasswort ist erforderlich.'
		);
	});

	it('keeps unknown messages and English as they are', () => {
		expect(localizeServerMessage('de', 'Something else')).toBe('Something else');
		expect(localizeServerMessage('en', 'Server not found.')).toBe('Server not found.');
	});
});

describe('pickLocale', () => {
	it('prefers the saved choice, then the browser language', () => {
		expect(pickLocale('de', 'en-US')).toBe('de');
		expect(pickLocale(undefined, 'de-DE,de;q=0.9,en;q=0.8')).toBe('de');
		expect(pickLocale('xx', 'fr-FR,fr')).toBe('en');
		expect(pickLocale(undefined, null)).toBe('en');
	});
});
