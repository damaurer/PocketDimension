import database from '$lib/server/database/database';
import { verify_email } from '$lib/server/security/validation';
import { ROLE_ENUM } from '$lib/utils';
import type {  User } from '@prisma/client';

export async function userAuthorization(locals: App.Locals, email: string | undefined) {
	const email_error = await verify_email(email);
	if (email_error) {
		console.error(email_error);
		return;
	}

	if(locals?.userInformation?.user?.email === email) {
		return
	}

	const user = await database.user.findUnique({
		where: { email: email as string },
		include: {
			roles: true
		}
	}) as User;

	locals.userInformation = {
		user: user,
		roles: user.roles,
		isAdmin: ROLE_ENUM.isAdmin(user)
	};
	console.log("USER INFORMATION", locals.userInformation)
}