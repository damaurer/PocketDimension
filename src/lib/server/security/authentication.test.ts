import { beforeAll, describe, expect, it } from 'vitest';
import jsonwebtoken from 'jsonwebtoken';

const SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';

describe('session tokens', () => {
	let auth: typeof import('./authentication');

	beforeAll(async () => {
		process.env.SECRET_JWT_KEY = SECRET;
		auth = await import('./authentication');
	});

	it('round-trips user id and session version', () => {
		const token = auth.createToken({ id: 7, sessionVersion: 3 });
		expect(auth.verifyToken(token)).toEqual({ sub: '7', ver: 3 });
	});

	it('rejects tokens signed with another key', () => {
		const token = jsonwebtoken.sign({ ver: 0 }, 'another-secret-that-is-also-long-enough', {
			subject: '1',
			issuer: 'pocketdimension'
		});
		expect(auth.verifyToken(token)).toBeUndefined();
	});

	it('rejects unsigned tokens', () => {
		const token = jsonwebtoken.sign({ ver: 0, sub: '1', iss: 'pocketdimension' }, null, {
			algorithm: 'none'
		});
		expect(auth.verifyToken(token)).toBeUndefined();
	});

	it('rejects expired tokens and tokens without a session version', () => {
		const expired = jsonwebtoken.sign({ ver: 0, exp: 1 }, SECRET, {
			subject: '1',
			issuer: 'pocketdimension'
		});
		const legacy = jsonwebtoken.sign({ email: 'admin@example.com' }, SECRET);
		expect(auth.verifyToken(expired)).toBeUndefined();
		expect(auth.verifyToken(legacy)).toBeUndefined();
	});

	it('verifies passwords and fails for unknown users', async () => {
		const hash = await auth.hashPassword('correct horse battery');
		expect(await auth.verifyPassword('correct horse battery', hash)).toBe(true);
		expect(await auth.verifyPassword('wrong password', hash)).toBe(false);
		expect(await auth.verifyPassword('pocketdimension-dummy-password', undefined)).toBe(false);
	});

	it('marks cookies secure only on https', () => {
		expect(auth.cookieOptions(new URL('https://example.com')).secure).toBe(true);
		expect(auth.cookieOptions(new URL('http://localhost:3000')).secure).toBe(false);
	});
});
