import type { Actions } from '@sveltejs/kit';
import {
	getAllUsersWhereEmailIsNot, registerUser, updateUser
} from '$lib/server/services/user-service';
import { cookie_options } from '$lib/utils';
import type { PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { hashPassword } from '$lib/server/security/authentication';
import type { User } from '@prisma/client';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals?.userInformation?.isAdmin && locals?.userInformation?.user?.email) {
		return {
			users: await getAllUsersWhereEmailIsNot(locals.userInformation.user.email),
			isAdmin: true
		};
	}
	return {
		isAdmin: false
	}
};

export const actions: Actions = {
	updateAccount: async ({ locals, request, cookies }) => {

		const userAuthData = locals.userInformation.user;
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.toLowerCase()?.trim();
		const password = (data.get('password') as string)?.trim();

		const update: User = { ...userAuthData } as User;

		if (name && name !== userAuthData.name) {
			update.name = name;
		}
		if (email && email !== userAuthData.email) {
			update.email = email;
		}

		if (password) {
			const password_is_correct = await bcrypt.compare(
				password,
				userAuthData.password
			);

			if (password && !password_is_correct) {
				update.password = await hashPassword(password);
			}
		}

		const user = await updateUser(update) as User;

		if ('status' in user && 'data' in user) {
			return user;
		}

		cookies.set('email', user.email, cookie_options);
		cookies.set('name', user.name, cookie_options);

		return {
			...user,
			password: undefined
		};
	},
	registerUser: async ({ locals, request }) => {
		if (!locals.userInformation.isAdmin) {
			return fail(500, { message: "Only Admins can create other Accounts" });
		}

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
    const email = (data.get('email') as string)?.toLowerCase()?.trim();
    const password = (data.get('password') as string)?.trim();

		const user = await registerUser(email, password, name)
		return { ...user, password: undefined }
	},
	updateUser: async ({ locals, request }) => {
		if (!locals.userInformation.isAdmin) {
			return fail(500, { message: "Only Admins can change other Accounts" });
		}

		const userAuthData = locals.userInformation.user;

		const data = await request.formData();

		const name = (data.get('name') as string).trim();
		const email = (data.get('email') as string).trim();
		const password = (data.get('password') as string).trim();

		const update: User = { ...userAuthData } as User;

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

		return {
			...user,
			password: undefined
		};
	}

};