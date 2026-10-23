import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rateLimit';

describe('RateLimiter', () => {
	it('blocks after the limit and frees the key after the window', () => {
		let now = 0;
		const limiter = new RateLimiter(2, 60_000, () => now);

		expect(limiter.hit('a')).toBe(0);
		expect(limiter.hit('a')).toBe(0);
		expect(limiter.hit('a')).toBe(60);
		expect(limiter.hit('b')).toBe(0);

		now = 60_000;
		expect(limiter.hit('a')).toBe(0);
	});

	it('reset clears a key', () => {
		const limiter = new RateLimiter(1, 60_000, () => 0);
		limiter.hit('a');
		expect(limiter.hit('a')).toBeGreaterThan(0);
		limiter.reset('a');
		expect(limiter.hit('a')).toBe(0);
	});

	it('retryAfter reports a block without counting an attempt', () => {
		const limiter = new RateLimiter(1, 60_000, () => 0);
		expect(limiter.retryAfter('a')).toBe(0);
		limiter.hit('a');
		expect(limiter.retryAfter('a')).toBe(0);
		limiter.hit('a');
		expect(limiter.retryAfter('a')).toBe(60);
	});
});
