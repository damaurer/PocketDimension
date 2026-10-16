import { describe, expect, it } from 'vitest';
import { translate } from './i18n';

describe('translate', () => {
	it('escapes variables', () => {
		expect(translate('en', 'login.welcome', { name: '<img src=x onerror=alert(1)>' })).toContain(
			'&lt;img src=x onerror=alert(1)&gt;'
		);
	});
});
