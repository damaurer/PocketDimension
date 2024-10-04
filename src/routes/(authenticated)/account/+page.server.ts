import type { Actions } from '@sveltejs/kit';
import {
	getAllUsersWhereEmailIsNot, updateUser
} from '$lib/server/services/user-service';
import { fail } from '@sveltejs/kit';
import { cookie_options } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals?.userInformation?.isAdmin && locals?.userInformation?.user?.email) {
		return {
			users: await getAllUsersWhereEmailIsNot(locals.userInformation.user.email)
		};
	}
	return
};

export const actions: Actions = {
	updateUser: async (event) => {
		const data = await event.request.formData();
		const name = (data.get('name') as string)?.trim();

		const update = await updateUser(event.cookies, name);

		if ('error' in update) {
			return fail(400, { error: update.error });
		}

		event.cookies.set('name', name, cookie_options);

		const message = `Your new name is ${name}.`;

		return { name, message };
	},
};