import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formString } from '#lib/server/security/validation.ts';
import {
	createToken,
	setSessionCookie,
	verifyPassword
} from '#lib/server/security/authentication.ts';
import { loginLimiter } from '#lib/server/security/rateLimit.ts';
import { isAdmin } from '#lib/utils.ts';

const LOGIN_FAILED = 'Email/name or password is not correct.';

const homeFor = (roles: Parameters<typeof isAdmin>[0]) =>
	isAdmin(roles) ? '/container' : '/games';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(303, homeFor(locals.user.roles));
	}
};

export const actions: Actions = {
	default: async ({ request, locals, cookies, url, getClientAddress }) => {
		const data = await request.formData();
		const emailOrName = formString(data, 'email_or_name');
		const password =
			typeof data.get('password') === 'string' ? (data.get('password') as string) : '';

		if (!emailOrName || !password) {
			return fail(400, { message: 'Email/name and password are required.' });
		}

		const limiterKey = `${getClientAddress()}|${emailOrName.toLowerCase()}`;
		const retryAfter = loginLimiter.hit(limiterKey);
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
			return fail(400, { message: LOGIN_FAILED });
		}

		loginLimiter.reset(limiterKey);
		setSessionCookie(cookies, url, createToken(user));
		redirect(303, homeFor(user.roles));
	}
};
