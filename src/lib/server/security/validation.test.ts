import { describe, expect, it } from 'vitest';
import { formString, verify_email, verify_name, verify_password } from './validation';

describe('validation', () => {
	it('accepts valid input', () => {
		expect(verify_email('player@example.com')).toBeUndefined();
		expect(verify_name('Player One')).toBeUndefined();
		expect(verify_password('a-long-password')).toBeUndefined();
	});

	it('rejects invalid input', () => {
		expect(verify_email('not-an-email')).toBeDefined();
		expect(verify_email(`${'a'.repeat(250)}@example.com`)).toBeDefined();
		expect(verify_name('a')).toBeDefined();
		expect(verify_name('me@example.com')).toBeDefined();
		expect(verify_password('short')).toBeDefined();
		expect(verify_password('x'.repeat(73))).toBeDefined();
	});

	it('reads form strings safely', () => {
		const data = new FormData();
		data.set('name', '  Player  ');
		data.set('file', new Blob(['x']));
		expect(formString(data, 'name')).toBe('Player');
		expect(formString(data, 'file')).toBe('');
		expect(formString(data, 'missing')).toBe('');
	});
});
