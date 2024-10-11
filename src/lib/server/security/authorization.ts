import { verify_email } from '$lib/server/security/validation';
import { isAdmin } from '$lib/utils';
import { findUserWhereEmail } from '$lib/server/database/repository/user';

export async function userAuthorization(locals: App.Locals, email: string | undefined) {
	const email_error = await verify_email(email);
	if (email_error) {
		return;
	}

	if (locals?.userInformation?.user?.email === email) {
		return;
	}

	if (email) {
		const user = findUserWhereEmail(email);

		locals.userInformation = {
			user: user,
			roles: user.roles,
			isAdmin: isAdmin(user.roles)
		};
	}
}