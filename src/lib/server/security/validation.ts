import { email_regexp } from '$lib/utils';
import prisma from '$lib/server/config/prisma';

export function validEmail(email: string): boolean {
	return !!email.match(email_regexp);
}

export async function verify_email(email: string | undefined, newUser: boolean = false): Promise<string | undefined> {
	if (!email) {
		return 'Email is required.';
	}

	if (!validEmail(email)) {
		return 'Please enter a valid email.';
	}

	if (newUser) {
		const previous_user = await prisma.user.findUnique({
			where: {
				email: email
			}
		});

		if (previous_user) {
			return 'There is already an account with this email.';
		}
	}

}


export function verify_password(password?: string): string | undefined {
	if (!password) {
		return 'Password is required.';
	}

	if (password.length < 8) {
		return 'Password must be at least 8 characters.';
	}
}

export function verify_name(name?: string): string {
	if (!name) {
		return 'Name is required.';
	}

	if (name.length <= 1) {
		return 'Name has to be at least 2 characters.';
	}

	return '';
}