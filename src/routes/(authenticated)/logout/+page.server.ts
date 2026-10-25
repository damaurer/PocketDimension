import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { clearSessionCookie } from '#lib/server/security/authentication.ts';
import { logoutUrl } from '#lib/server/security/oidc.ts';

export const actions: Actions = {
	default: async ({ cookies, url }) => {
		clearSessionCookie(cookies, url);
		// After a single sign-on, also end the session at the provider.
		const target = await logoutUrl(cookies, url);
		if (target) redirect(303, target.href, { external: [target.origin] });
		redirect(303, '/');
	}
};
