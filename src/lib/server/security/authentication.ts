import jsonwebtoken from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Cookies } from '@sveltejs/kit';
import { config } from '#lib/server/config.ts';

export const AUTH_COOKIE = 'auth-token';

const ALGORITHM = 'HS256';
const ISSUER = 'pocketdimension';
const BCRYPT_ROUNDS = 12;

// Compared against when a login names an unknown user, so that a wrong user name
// takes as long as a wrong password and does not reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('pocketdimension-dummy-password', BCRYPT_ROUNDS);

export interface SessionClaims {
	/** user id */
	sub: string;
	/** session version of the user when the token was issued */
	ver: number;
}

export function createToken(user: { id: number; sessionVersion: number }): string {
	return jsonwebtoken.sign({ ver: user.sessionVersion }, config.jwtSecret, {
		algorithm: ALGORITHM,
		issuer: ISSUER,
		subject: String(user.id),
		expiresIn: config.sessionMaxAgeSeconds
	});
}

export function verifyToken(token: string | undefined): SessionClaims | undefined {
	if (!token) return undefined;
	try {
		const claims = jsonwebtoken.verify(token, config.jwtSecret, {
			algorithms: [ALGORITHM],
			issuer: ISSUER
		});
		if (typeof claims !== 'object' || typeof claims.sub !== 'string' || typeof claims.ver !== 'number') {
			return undefined;
		}
		return { sub: claims.sub, ver: claims.ver };
	} catch {
		return undefined;
	}
}

export function cookieOptions(url: URL) {
	return {
		httpOnly: true,
		// Allows running locally over plain http; behind a TLS proxy the origin is https.
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		path: '/',
		maxAge: config.sessionMaxAgeSeconds
	} as const;
}

export function setSessionCookie(cookies: Cookies, url: URL, token: string) {
	cookies.set(AUTH_COOKIE, token, cookieOptions(url));
}

export function clearSessionCookie(cookies: Cookies, url: URL) {
	cookies.delete(AUTH_COOKIE, cookieOptions(url));
}

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
	return bcrypt.compare(password, hash ?? DUMMY_HASH).then((ok) => ok && hash !== undefined);
}
