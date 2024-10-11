
import {
	getAllUsersWhereEmailIsNot
} from '$lib/server/services/user-service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals?.userInformation?.isAdmin && locals?.userInformation?.user?.email) {
		return {
			users: getAllUsersWhereEmailIsNot(locals.userInformation.user.email),
			isAdmin: true
		};
	}
	return {
		isAdmin: false
	}
};

