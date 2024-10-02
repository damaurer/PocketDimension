import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	const user = await db.getUserFromSession(cookies.get('sessionid'));

	return { user };
};

export const actions = {
	login: async ({ cookies, request, url }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		if (!email) {
			return fail(400, { email, missing: true });
		}

		const user = await db.getUser(email);

		if (!user || user.password !== hash(password)) {
			return fail(400, { email, incorrect: true });
		}

		cookies.set('sessionid', await db.createSession(user), { path: '/' });

		if (url.searchParams.has('redirectTo')) {
			redirect(303, url.searchParams.get('redirectTo'));
		}

		return { success: true };
	},
} satisfies Actions;