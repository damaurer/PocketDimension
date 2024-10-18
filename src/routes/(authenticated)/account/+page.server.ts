import type { Actions } from '@sveltejs/kit';
import { cookie_options } from '$lib/utils';
import type { PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { hashPassword } from '$lib/server/security/authentication';
import { fail } from '@sveltejs/kit';
import { verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import { userRepository } from '$lib/server/database/database';
import type { InsertValues, UpdateValues } from '$lib/server/database/types';
import { Role } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.isAdmin && locals.user) {
		return {
			user: { ...locals.user, password: undefined },
			isAdmin: locals.isAdmin,
			users: userRepository.findAll({
				value: 'email != $email',
				params: { $email: locals.user.email }
			})
		};
	}

	return {
		user: { ...locals.user, password: undefined },
		isAdmin: locals.isAdmin,
		users: []
	};
};

export const actions: Actions = {
	updateAccount: async ({ locals, request, cookies }) => {
		const userAuthData = locals.user;
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.toLowerCase()?.trim();
		const password = (data.get('password') as string)?.trim();

		const update: UpdateValues = {};

		if (name && name !== userAuthData.name) {
			const name_error = verify_name(name);

			if (name_error) {
				return fail(500, { message: name_error });
			}
			update['$name'] = name;
		}
		if (email && email !== userAuthData.email) {

			const email_error = await verify_email(email);
			if (email_error) {
				return fail(500, { message: email_error });
			}

			update['$email'] = email;
		}

		if (password) {
			const password_error = verify_password(password);
			if (password_error) {
				return fail(500, { message: password_error });
			}
			const password_is_correct = await bcrypt.compare(
				password,
				userAuthData.password
			);

			if (password && !password_is_correct) {
				update['$password'] = await hashPassword(password);
			}
		}

		const user = await userRepository.update({
			where: {
				value: 'id = $id',
				params: { $id: userAuthData.id }
			},
			values: update
		});

		cookies.set('email', user.email, cookie_options);
		if (user.name) {
			cookies.set('name', user.name, cookie_options);
		}

		return {
			...user,
			password: undefined
		};
	},
	registerUser: async ({ locals, request }) => {
		if (!locals.isAdmin) {
			return fail(500, { message: 'Only Admins can create other Accounts' });
		}

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.toLowerCase()?.trim();
		const password = (data.get('password') as string)?.trim();
		const isAdmin = (data.get('isAdmin') as boolean);

		const name_error = verify_name(name);

		const insert: InsertValues = {};

		if (name_error) {
			return fail(500, { message: name_error });
		}
		insert['$name'] = name;

		const email_error = await verify_email(email);
		if (email_error) {
			return fail(500, { message: email_error });
		}
		insert['$email'] = email;

		const password_error = verify_password(password);
		if (password_error) {
			return fail(500, { message: password_error });
		}
		insert['$password'] = await hashPassword(password!);

		const roles = [Role.USER_ROLE];
		if (isAdmin) roles.push(Role.ADMINISTRATOR_ROLE);

		const user = await userRepository.insertWithRole({
			values: insert,
			where: {
				value: 'email = $email',
				params: {
					$email: email
				}
			}
		}, roles);
		return { ...user, password: undefined };
	},
	updateUser: async ({ locals, request }) => {
		if (!locals.isAdmin) {
			return fail(500, { message: 'Only Admins can change other Accounts' });
		}

		const data = await request.formData();

		const id = (data.get('id') as string).trim();
		const name = (data.get('name') as string).trim();
		const email = (data.get('email') as string).trim();
		const password = (data.get('password') as string).trim();
		const isAdmin = (data.get('isAdmin') as boolean);

		if (!id) {
			return fail(500, { message: 'Missing Id' });
		}

		let user = await userRepository.findBy({
			value: 'id = $id',
			params: {
				$id: id
			}
		});

		if (!user) {
			return fail(500, { message: 'No User to update found' });
		}

		const update: UpdateValues = {};

		if (name !== user.name) {
			update['$name'] = name;
		}
		if (email !== user.email) {
			update['$email'] = email;
		}
		const password_is_correct = await bcrypt.compare(
			password,
			user.password
		);

		if (password && !password_is_correct) {
			update['$password'] = await hashPassword(password);
		}

		const roles = [Role.USER_ROLE];
		if (isAdmin) {
			roles.push(Role.ADMINISTRATOR_ROLE);
		}

		user = await userRepository.updateWithRole({
			where: {
				value: 'id = $id',
				params: { $id: user.id }
			},
			values: update
		}, roles);


		return {
			...user,
			password: undefined
		};
	}

};