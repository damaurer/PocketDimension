import { describe, expect, it } from 'vitest';
import { isContainerId } from './container.client';

describe('isContainerId', () => {
	it('accepts short and full Docker ids only', () => {
		expect(isContainerId('0123456789ab')).toBe(true);
		expect(isContainerId('a'.repeat(64))).toBe(true);
		expect(isContainerId('my-container')).toBe(false);
		expect(isContainerId('../containers/json')).toBe(false);
		expect(isContainerId(42)).toBe(false);
	});
});
