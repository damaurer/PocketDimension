import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '#lib/server/config.ts';
import { createToken, setSessionCookie } from '#lib/server/security/authentication.ts';
import {
	finishLogin,
	rememberIdToken,
	signIn,
	SsoLoginError,
	type SsoError
} from '#lib/server/security/oidc.ts';
import { loginFailureLimiter } from '#lib/server/security/rateLimit.ts';

export const GET: RequestHandler = async ({ cookies, url, locals, getClientAddress }) => {
	if (!config.oidc.enabled) error(404, 'Not found');

	const address = getClientAddress();
	if (loginFailureLimiter.retryAfter(address) > 0) {
		redirect(303, '/?sso_error=too-many');
	}

	let code: SsoError | undefined;
	try {
		const { profile, idToken } = await finishLogin(cookies, url);
		const user = await signIn(locals.repositories.user, profile);
		setSessionCookie(cookies, url, createToken(user));
		rememberIdToken(cookies, url, idToken);
	} catch (e) {
		if (e instanceof SsoLoginError) {
			code = e.code;
		} else {
			console.error('Single sign-on failed:', e);
			code = 'failed';
		}
		loginFailureLimiter.hit(address);
	}

	redirect(303, code ? `/?sso_error=${code}` : '/servers');
};
