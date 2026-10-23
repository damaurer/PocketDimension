import { describe, expect, it } from 'vitest';
import { translate } from './i18n';

describe('translate', () => {
	it('escapes variables', () => {
		expect(translate('en', 'login.welcome', { name: '<img src=x onerror=alert(1)>' })).toContain(
			'&lt;img src=x onerror=alert(1)&gt;'
		);
	});
});

describe('translations', () => {
	it('have the same keys in every language', async () => {
		const { default: all } = await import('./translations');
		const [first, ...rest] = Object.values(all).map((t) => Object.keys(t).sort());
		for (const keys of rest) expect(keys).toEqual(first);
	});
});
