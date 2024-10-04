import type { Actions } from '@sveltejs/kit';
import {
	getAllUsersWhereEmailIsNot, updateUser
} from '$lib/server/services/user-service';
import { cookie_options } from '$lib/utils';
import type { PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { hashPassword } from '$lib/server/security/authentication';
import type { User } from '@prisma/client';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals?.userInformation?.isAdmin && locals?.userInformation?.user?.email) {
		return {
			users: await getAllUsersWhereEmailIsNot(locals.userInformation.user.email)
		};
	}
	return
};

export const actions: Actions = {
	updateUser: async ({locals, request, cookies}) => {

		const userAuthData = locals.userInformation.user
		const data = await request.formData();

		const name = (data.get("name") as string).trim()
		const email = (data.get("email") as string).trim();
    const password = (data.get("password") as string).trim();

		const update: User = {...userAuthData} as User

		if (name !== userAuthData.name) {
      update.name = name;
    }
    if (email !== userAuthData.email) {
      update.email = email;
    }
		const password_is_correct = await bcrypt.compare(
			password,
			userAuthData.password
		);

    if (password && !password_is_correct) {
      update.password = await hashPassword(password);
    }

		const user = await updateUser(update) as User;

		if ('status' in user && 'data' in user) {
			return user;
		}

		cookies.set("email", user.email, cookie_options);
		cookies.set("name", user.name, cookie_options);

		return {
			...user,
			password: undefined
		};
	},
};