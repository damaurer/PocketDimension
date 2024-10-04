import prisma from '$lib/server/config/prisma';
import { verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import type { User } from '@prisma/client';
import { authentication, createToken, hashPassword } from '$lib/server/security/authentication';
import type { ActionFailure, Cookies } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';

const USER_SELECT = {
	email: true,
	name: true,
	roles: true,
	createdAt: true,
	updatedAt: true
}


export async function getAllUsersWhereEmailIsNot(email: string) {
	return prisma.user.findMany({
		where: {
			NOT: {
				email
			}
		},
		select: USER_SELECT
	});
}

export async function registerUser(
	email: string,
	password: string,
	name: string
): Promise<ActionFailure<{ message: string }> | User> {
	const email_error = await verify_email(email, true);

	if (email_error) {
		return fail(500, { message: email_error });
	}

	const password_error = await verify_password(password);

	if (password_error) {
		return fail(500, { message: password_error });
	}

	const name_error = verify_name(name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	const hashed_password = await hashPassword(password);

	try {
		const user = await prisma.user.create({
			data: {
				email,
				password: hashed_password,
				name
			}
		});

		return {
			...user,
			password: undefined
		}

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

	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		return fail(500, { message: 'Email could not be found.' });
	}

	const password_error = await verify_password(password, (user as User).password);
	if (password_error) {
		return fail(500, { message: password_error });
	}

	return {
		...user,
		password: undefined
	} as User;
}

export async function updateUser(
	cookies: Cookies,
	user: User
): Promise<ActionFailure<{ message: string }> | { user: User }> {
	const auth = authentication(cookies);

	if (!auth) {
		return fail(500, { message: 'You are not authorized.' });
	}

	const name_error = verify_name(user.name);

	if (name_error) {
		return fail(500, { message: name_error });
	}

	try {
		const updatedUser = await prisma.user.update({
			data: {
				email: user.email,
				name: user.name
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

