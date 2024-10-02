import bcrypt from 'bcrypt';

import prisma from '$lib/server/config/prisma';
import { validEmail, verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import type { User } from '@prisma/client';
import { createToken } from '$lib/server/security/authenticate';

export async function register_user(
	email: string,
	password: string,
	name: string
): Promise<{ error: string }> {
	const email_error = await verify_email(email);

	if (email_error) {
		return { error: email_error };
	}

	const password_error = verify_password(password);

	if (password_error) {
		return { error: password_error };
	}

	const name_error = verify_name(name);

	if (name_error) {
		return { error: name_error };
	}

	const salt_rounds = 10;
	const hashed_password = await bcrypt.hash(password, salt_rounds);

	const user = prisma.user.create({
		data: {
			email,
			password: hashed_password,
			name
		}
	});

	try {
		await user;
		return { error: '' };
	} catch (err) {
		return { error: err?.toString() as string };
	}
}

export async function login_user(
	email: string ,
	password: string
): Promise<{ error: string } | { token: string; user: User }> {
	const user = await get_user(email, password);

	if ("error" in user) {
		return { error: user.error };
	}

	const token = createToken(user);

	return { token, user };
}

async function get_user(
	email: string,
	password: string
): Promise<{ error: string } | User> {
	if (!email) {
		return { error: "Email is required." };
	}

	if (!validEmail(email)) {
		return { error: "Please enter a valid email." };
	}

	const  user  = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		return { error: "Email could not be found." };
	}

	if (!password) {
		return { error: "Password is required." };
	}

	const password_is_correct = await bcrypt.compare(
		password,
		user.password
	);

	if (!password_is_correct) {
		return { error: "Password is not correct." };
	}


	const name = user.name;

	return { email, name };
}