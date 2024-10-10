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

