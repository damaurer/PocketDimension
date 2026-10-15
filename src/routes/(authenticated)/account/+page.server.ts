import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	createToken,
	hashPassword,
	setSessionCookie,
	verifyPassword
} from '#lib/server/security/authentication.ts';
import {
	formPassword,
	formString,
	verify_email,
	verify_name,
	verify_password
} from '#lib/server/security/validation.ts';
import { toPublicUser, type UserChanges } from '#lib/server/database/repository/user.repository.ts';
import { Role } from '#lib/types.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const users = locals.isAdmin
		? (await locals.repositories.user.findAllExcept(user.id)).map(toPublicUser)
		: [];

	return { user, isAdmin: locals.isAdmin, users };
};

/** True for a UNIQUE violation, i.e. the email is already taken. */
function isConstraintError(e: unknown) {
	return (e as { code?: string })?.code === 'SQLITE_CONSTRAINT';
}

function readProfile(data: FormData) {
	return {
		name: formString(data, 'name'),
		email: formString(data, 'email').toLowerCase(),
		password: formPassword(data, 'password')
	};
}

export const actions: Actions = {
	updateAccount: async ({ locals, request, cookies, url }) => {
		const repository = locals.repositories.user;
		const current = (await repository.findById(locals.user!.id))!;

		const data = await request.formData();
		const { name, email, password } = readProfile(data);
		const currentPassword = formPassword(data, 'currentPassword');

		const changes: UserChanges = {};

		if (name && name !== current.name) {
			const message = verify_name(name);
			if (message) return fail(400, { message });
			changes.name = name;
		}

		if (email && email !== current.email) {
			const message = verify_email(email);
			if (message) return fail(400, { message });
			changes.email = email;
		}

		if (password) {
			const message = verify_password(password);
			if (message) return fail(400, { message });
			changes.passwordHash = await hashPassword(password);
		}

		if (changes.email || changes.passwordHash) {
			if (!(await verifyPassword(currentPassword, current.password))) {
				return fail(400, { message: 'Current password is required to change email or password.' });
			}
		}

		try {
			const updated = (await repository.update(current.id, changes))!;
			if (changes.passwordHash) {
				// The password change invalidated all sessions; keep this one signed in.
				setSessionCookie(cookies, url, createToken(updated));
			}
			return { success: true, message: 'Account updated.' };
		} catch (e) {
			if (isConstraintError(e)) return fail(400, { message: 'This email is already in use.' });
			throw e;
		}
	},

	registerUser: async ({ locals, request }) => {
		if (!locals.isAdmin) {
			error(403, 'Only administrators can create accounts.');
		}

		const data = await request.formData();
		const { name, email, password } = readProfile(data);

		const message = verify_name(name) ?? verify_email(email) ?? verify_password(password);
		if (message) return fail(400, { message });

		const roles = [Role.USER_ROLE];
		if (data.get('isAdmin') === 'on') roles.push(Role.ADMINISTRATOR_ROLE);

		try {
			await locals.repositories.user.create(
				{ name, email, passwordHash: await hashPassword(password) },
				roles
			);
			return { success: true, message: 'User created.' };
		} catch (e) {
			if (isConstraintError(e)) return fail(400, { message: 'This email is already in use.' });
			throw e;
		}
	},

	updateUser: async ({ locals, request }) => {
		if (!locals.isAdmin) {
			error(403, 'Only administrators can change other accounts.');
		}

		const data = await request.formData();
		const id = Number(formString(data, 'id'));
		const { name, email, password } = readProfile(data);

		if (!Number.isInteger(id) || id === locals.user!.id) {
			return fail(400, { message: 'Invalid user.' });
		}

		const user = await locals.repositories.user.findById(id);
		if (!user) {
			return fail(404, { message: 'User not found.' });
		}

		const changes: UserChanges = {};
		if (name && name !== user.name) {
			const message = verify_name(name);
			if (message) return fail(400, { message });
			changes.name = name;
		}
		if (email && email !== user.email) {
			const message = verify_email(email);
			if (message) return fail(400, { message });
			changes.email = email;
		}
		if (password) {
			const message = verify_password(password);
			if (message) return fail(400, { message });
			changes.passwordHash = await hashPassword(password);
		}

		const roles = [Role.USER_ROLE];
		if (data.get('isAdmin') === 'on') roles.push(Role.ADMINISTRATOR_ROLE);

		try {
			await locals.repositories.user.update(id, changes, roles);
			return { success: true, message: 'User updated.' };
		} catch (e) {
			if (isConstraintError(e)) return fail(400, { message: 'This email is already in use.' });
			throw e;
		}
	}
};
