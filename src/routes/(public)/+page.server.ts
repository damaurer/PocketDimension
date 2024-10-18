import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { cookie_options } from '$lib/utils';
import { validEmail, verify_email, verify_name, verify_password } from '$lib/server/security/validation';
import bcrypt from 'bcrypt';
import { createToken } from '$lib/server/security/authentication';
import type { User } from '$lib/types';
import { userRepository } from '$lib/server/database/database';


export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();

		const email_or_name = data.get('email_or_name') as string;
		const password = data.get('password') as string;

		if (email_or_name && validEmail(email_or_name)) {
			const email_error = await verify_email(email_or_name);

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

		const users = await userRepository.findAll({
			where: {
				value: 'User.email = $email or User.name = $name',
				params: {
					$email: email_or_name,
					$name: email_or_name
				}
			}
		});

		if (!users || users.length === 0) {
			return fail(500, { message: 'User could not be found.' });
		}

		const user = users.find(async user => await bcrypt.compare(password, user.password));

		if (!user) {
			return fail(500, { message: 'Password is not correct.' });
		}

		const token = createToken(user as User);


		event.cookies.set('auth-token', token, cookie_options);
		event.cookies.set('email', user.email, cookie_options);

		redirect(302, '/container');
	}
};