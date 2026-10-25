import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { config } from '#lib/server/config.ts';
import { startLogin } from '#lib/server/security/oidc.ts';

export const GET: RequestHandler = async ({ cookies, url }) => {
	if (!config.oidc.enabled) error(404, 'Not found');

	let target: URL;
	try {
		target = await startLogin(cookies, url);
	} catch {
		redirect(303, '/?sso_error=failed');
	}
	redirect(303, target.href, { external: [target.origin] });
};
