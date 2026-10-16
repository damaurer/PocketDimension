import { email_regexp } from '#lib/utils.ts';

export const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 72; // bcrypt ignores everything after 72 bytes
const NAME_MAX_LENGTH = 64;
const EMAIL_MAX_LENGTH = 254;

export function validEmail(email: string): boolean {
	return email.length <= EMAIL_MAX_LENGTH && email_regexp.test(email);
}

export function verify_email(email: string | undefined): string | undefined {
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

	if (password.length < PASSWORD_MIN_LENGTH) {
		return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
	}

	if (Buffer.byteLength(password) > PASSWORD_MAX_LENGTH) {
		return `Password must be at most ${PASSWORD_MAX_LENGTH} bytes.`;
	}
}

export function verify_name(name?: string): string | undefined {
	if (!name) {
		return 'Name is required.';
	}

	if (name.length < 2) {
		return 'Name has to be at least 2 characters.';
	}

	if (name.length > NAME_MAX_LENGTH) {
		return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
	}

	if (name.includes('@')) {
		return 'Name must not contain "@".';
	}
}

/** Reads a trimmed string field from form data; files and missing fields become ''. */
export function formString(data: FormData, key: string): string {
	return formPassword(data, key).trim();
}

/** Reads a field as is. Passwords are never trimmed. */
export function formPassword(data: FormData, key: string): string {
	const value = data.get(key);
	return typeof value === 'string' ? value : '';
}
