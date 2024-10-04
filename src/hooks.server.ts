import { authentication } from '$lib/server/security/authentication';
import { type Handle,  redirect } from '@sveltejs/kit';
import { userAuthorization } from '$lib/server/security/authorization';

export const handle: Handle = async ({ event, resolve }) => {
	const is_protected = event.route.id?.startsWith("/(authenticated)")

	const auth = authentication(event.cookies);

	if (is_protected && !auth) {
		event.cookies.delete("email",{path: ''});
		event.cookies.delete("name", { path: ''});
		throw redirect(307, "/");
	}else {
		await userAuthorization(event.locals, event.cookies.get("email"))
	}


	return resolve(event);
};

