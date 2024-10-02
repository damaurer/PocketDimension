import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// event.locals.user = await getUser(event.cookies.get('sessionid'));
	event.locals.user = false
	return resolve(event);
};