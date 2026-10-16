import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Handle, ServerInit } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import {
	clearSessionCookie,
	AUTH_COOKIE,
	verifyToken
} from '#lib/server/security/authentication.ts';
import { getRepositories, getServerManager } from '#lib/server/services.ts';
import { toPublicUser } from '#lib/server/database/repository/user.repository.ts';
import { isAdmin } from '#lib/utils.ts';

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
	'Cross-Origin-Opener-Policy': 'same-origin'
};

async function loadCurrentUser(event: RequestEvent) {
	const { locals, cookies, url } = event;
	locals.user = undefined;
	locals.isAdmin = false;

	const token = cookies.get(AUTH_COOKIE);
	if (!token) return;

	const claims = verifyToken(token);
	const record = claims && (await locals.repositories.user.findById(Number(claims.sub)));

	// Unknown user or a session issued before the last password change.
	if (!claims || !record || record.sessionVersion !== claims.ver) {
		clearSessionCookie(cookies, url);
		return;
	}

	locals.user = toPublicUser(record);
	locals.isAdmin = isAdmin(record.roles);
}

function isProtected({ route, url }: RequestEvent) {
	return route.id?.startsWith('/(authenticated)') || url.pathname.startsWith('/api/');
}

export const init: ServerInit = () => {
	if (building) return;
	// Finish servers whose creation was interrupted by a restart. Docker may be
	// unavailable at this point; the servers page retries on demand.
	getServerManager().catch((e) => console.error('Docker:', e));
};

export const handle: Handle = async ({ event, resolve }) => {
	if (building) {
		return resolve(event);
	}

	event.locals.repositories = await getRepositories();
	await loadCurrentUser(event);

	if (isProtected(event) && !event.locals.user) {
		if (event.url.pathname.startsWith('/api/')) {
			error(401, 'Not authenticated');
		}
		redirect(303, '/');
	}

	const response = await resolve(event);

	for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(header, value);
	}
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	if (event.locals.user) {
		response.headers.set('Cache-Control', 'private, no-store');
	}

	return response;
};
