import { email_regexp } from '$lib/utils';

export function validEmail(email: string): boolean {
	return !!email.match(email_regexp);
}

export async function verify_email(email: string | undefined): Promise<string | undefined> {
	if (!email) {
		return 'Email is required.';
	}

	if (!validEmail(email)) {
		return 'Please enter a valid email.';
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

export function verify_name(name?: string): string | undefined{
	if (!name) {
		return 'Name is required.';
	}

	if (name.length <= 1) {
		return 'Name has to be at least 2 characters.';
	}

}