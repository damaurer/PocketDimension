import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formPassword, formString } from '#lib/server/security/validation.ts';
import {
	createToken,
	setSessionCookie,
	verifyPassword
} from '#lib/server/security/authentication.ts';
import { loginFailureLimiter, loginLimiter } from '#lib/server/security/rateLimit.ts';
import { SSO_ERRORS } from '#lib/server/security/oidc.ts';
import { config } from '#lib/server/config.ts';

const LOGIN_FAILED = 'Email/name or password is not correct.';

const HOME = '/servers';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, HOME);
	}

	const ssoError = url.searchParams.get('sso_error');
	return {
		sso: config.oidc.enabled ? { name: config.oidc.name } : undefined,
		localLogin: config.localLogin,
		ssoError:
			ssoError && Object.hasOwn(SSO_ERRORS, ssoError)
				? SSO_ERRORS[ssoError as keyof typeof SSO_ERRORS]
				: undefined
	};
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, getClientAddress }) => {
		if (!config.localLogin) {
			return fail(403, { message: 'Login with a password is turned off.' });
		}

		const data = await request.formData();
		const emailOrName = formString(data, 'email_or_name');
		const password = formPassword(data, 'password');

		if (!emailOrName || !password) {
			return fail(400, { message: 'Email/name and password are required.' });
		}

		const address = getClientAddress();
		const limiterKey = `${address}|${emailOrName.toLowerCase()}`;
		const retryAfter = loginFailureLimiter.retryAfter(address) || loginLimiter.hit(limiterKey);
		if (retryAfter > 0) {
			return fail(429, {
				message: `Too many login attempts. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
			});
		}

		const candidates = await locals.repositories.user.findByEmailOrName(emailOrName);

		let user;
		if (candidates.length === 0) {
			await verifyPassword(password, undefined);
		}
		for (const candidate of candidates) {
			if (await verifyPassword(password, candidate.password)) {
				user = candidate;
				break;
			}
		}

		if (!user) {
			loginFailureLimiter.hit(address);
			return fail(400, { message: LOGIN_FAILED });
		}

		loginLimiter.reset(limiterKey);
		setSessionCookie(cookies, url, createToken(user));
		redirect(303, HOME);
	}
};
