import { validEmail, verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import { createToken, hashPassword } from '$lib/server/security/authentication';
import type { ActionFailure } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import type { Failure, User } from '$lib/types';
import {
	findAllUsersWhereEmailIsNot,
	findUserByEmailOrName, findUsersWhereRoleIn,
	insertUser,
	updateUser
} from '$lib/server/database/repository/user';
import { Role } from '$lib/types';


export function getAllUsersWhereEmailIsNot(email: string) {
	return findAllUsersWhereEmailIsNot(email);
}

export function getAllUsersWithRoles(roles: Role[]) {
	return  findUsersWhereRoleIn(roles)
}

export function registerUser(
	email?: string,
	password?: string,
	name?: string,
	isAdmin?: boolean,
): Failure | User {
	const email_error = verify_email(email, true);

	if (email_error) {
		return fail(500, { message: email_error });
	}

	const password_error = verify_password(password);

	if (password_error) {
		return fail(500, { message: password_error });
	}

	const name_error = verify_name(name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	const hashed_password = hashPassword(password!);

	const roles = [Role.USER_ROLE]
	if(isAdmin) {
		roles.push(Role.ADMINISTRATOR_ROLE)
	}

	try {
		return insertUser(hashed_password, roles, email!, name );

	} catch (err) {
		console.error(err);
		return fail(500, { message: 'error.user.create' });
	}

}

export  function loginUser(
	email?: string,
	password?: string
): Failure | { token: string; user: User } {
	const user =  getUser(email, password);

	if ((user as ActionFailure).status && (user as Failure).data?.message) {
		return user as ActionFailure<{ message: string }>;
	}

	const token = createToken(user as User);

	return { token, user: user as User };
}

function getUser(
	email_or_name?: string,
	password?: string
): Failure | User {

	if (email_or_name && validEmail(email_or_name)) {
		const email_error =  verify_email(email_or_name);

		if (email_error) {
			return fail(500, { message: email_error });
		}
	} else {
		const name_error = verify_name(email_or_name);

		if (name_error) {
			return fail(500, { message: name_error });
		}
	}

	const password_error = verify_password(password);
	if (password_error) {
		return fail(500, { message: password_error });
	}

	const users = findUserByEmailOrName(email_or_name!);

	if (!users || users.length === 0) {
		return fail(500, { message: 'User could not be found.' });
	}

	const user = users.find(async user => await bcrypt.compare(password, user.password));

	if (!user) {
		return fail(500, { message: 'Password is not correct.' });
	}

	return {
		...user,
		password: undefined
	} as User;
}

export  function updateUserData(
	user: User
): Failure | User {
	const name_error = verify_name(user.name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	const password_error =  verify_password(user.password);
	if (password_error) {
		return fail(500, { message: password_error });
	}

	return updateUser(user)
}
