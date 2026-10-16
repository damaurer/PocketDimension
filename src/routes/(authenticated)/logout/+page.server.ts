import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { clearSessionCookie } from '#lib/server/security/authentication.ts';

export const actions: Actions = {
	default: async ({ cookies, url }) => {
		clearSessionCookie(cookies, url);
		redirect(303, '/');
	}
};
