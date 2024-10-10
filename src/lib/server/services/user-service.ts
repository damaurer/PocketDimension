import database from '$lib/server/database/database';
import { verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import { createToken, hashPassword } from '$lib/server/security/authentication';
import type { ActionFailure } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import type { User } from '$lib/types';
import { RoleEnum } from '$lib/types';
import { insertUser } from '$lib/server/database/repository/UserRepository';



export function getAllUser(): User[] {
	return database.prepare(`SELECT U.*  FROM USER U LEFT JOIN V_USER_ROLE VUR on VUR.userEmail = U.EMAIL LEFT JOIN ROLE R on VUR.roleName = R.name`).all() as User[]
}


export async function getAllUsersWhereEmailIsNot(email: string) {
	return database.user.findMany({
		where: {
			NOT: {
				email
			}
		},
	});
}

export async function registerUser(
	user:User
): Promise<ActionFailure<{ message: string }> | User> {
	const email_error = await verify_email(user.email, true);

	if (email_error) {
		return fail(500, { message: email_error });
	}

	const password_error = await verify_password(user.password);

	if (password_error) {
		return fail(500, { message: password_error });
	}

	const name_error = verify_name(user.name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	const hashed_password = await hashPassword(user.password!);

	try {
		return insertUser({ ...user, password: hashed_password });

	} catch (err) {
		console.error(err);
		return fail(500, { message: 'error.user.create' });
	}

}

export async function loginUser(
	email: string,
	password: string
): Promise<ActionFailure<{ message: string }> | { token: string; user: User }> {
	const user = await getUser(email, password);

	if ((user as ActionFailure).status && (user as ActionFailure<{ message: string }>).data?.message) {
		return user;
	}

	const token = createToken(user as User);

	return { token, user: user as User };
}

async function getUser(
	email: string,
	password: string
): Promise<ActionFailure<{ message: string }> | User> {

	const email_error = await verify_email(email);

	if (email_error) {
		return fail(500, { message: email_error });
	}

	const user = await database.user.findUnique({ where: { email } }) as User;

	if (!user) {
		return fail(500, { message: 'Email could not be found.' });
	}


	const password_error = verify_password(password);
	if (password_error) {
		return fail(500, { message: password_error });
	}

	if (user.password) {
		const password_is_correct = await bcrypt.compare(
			password,
			user.password
		);

		if (!password_is_correct) {
			return fail(500, { message: 'Password is not correct.' });
		}
	}

	return {
		...user,
		password: undefined
	} as User;
}

export async function updateUser(
	user: User
): Promise<ActionFailure<{ message: string }> | User> {
	const name_error = verify_name(user.name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	const password_error = await verify_password(user.password);
	if (password_error) {
		return fail(500, { message: password_error });
	}

	try {
		const updatedUser = await database.user.update({
			data: {
				email: user.email,
				name: user.name,
				password: user.password
			},
			where: {
				email: user.email
			},
			select: USER_SELECT
		});

		return updatedUser as User;
	} catch (err) {
		console.error(err);
		return fail(500, { message: 'error.user.update' });
	}
}

