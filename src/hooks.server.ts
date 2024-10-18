import { authentication } from '$lib/server/security/authentication';
import { type Handle, redirect } from '@sveltejs/kit';
import { userRepository } from '$lib/server/database/database';
import { verify_email } from '$lib/server/security/validation';
import { isAdmin } from '$lib/utils';

export const handle: Handle = async ({ event, resolve }) => {
	const { route, cookies, locals } = event;
	const is_protected = route.id?.startsWith('/(authenticated)');

	const auth = authentication(event.cookies);

	if (is_protected && !auth) {
		cookies.delete('email', { path: '' });
		throw redirect(307, '/');
	}


	const email = cookies.get('email')?.toString().toLowerCase().trim();

	const email_error = await verify_email(email);

	if (email && !email_error) {
		locals.user = await userRepository.findBy({
			value: 'email = $email',
			params: { $email: email }
		});
		locals.isAdmin = isAdmin(locals.user.roles);
	}

	return resolve(event);
};

