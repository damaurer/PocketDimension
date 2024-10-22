import { authentication } from '$lib/server/security/authentication';
import { type Handle, redirect, RequestEvent } from '@sveltejs/kit';
import { connectDatabaseClient } from '$lib/server/database/client';
import { verify_email } from '$lib/server/security/validation';
import { isAdmin } from '$lib/utils';
import { initUserRepository } from '$lib/server/database/repository/user.repository';
import { initVUserRoleRepository } from '$lib/server/database/repository/vUserRole.repository';
import { initContainerFetchClient } from '$lib/server/docker/api/container.client';
import { initDockerClient, initDockerNetwork } from '$lib/server/docker/client';


const handleAuthentication = (event: RequestEvent) => {
	const { route, cookies } = event;
	const is_protected = route.id?.startsWith('/(authenticated)');

	const auth = authentication(event.cookies);

	if (is_protected && !auth) {
		cookies.delete('email', { path: '' });
		throw redirect(307, '/');
	}
};


const handleCurrentUser = async (event: RequestEvent) => {
	const { locals, cookies } = event;

	try {
		const email = cookies.get('email')?.toString().toLowerCase().trim();

		const email_error = await verify_email(email);

		if (email && !email_error) {
			locals.user = await locals.repositories.user.findBy({
				value: 'email = $email',
				params: { $email: email }
			});
			locals.isAdmin = isAdmin(locals.user.roles);
		}
	} catch (e) {
		console.error('Current User: ', e);
	}
};

const handleDatabase = async (event: RequestEvent) => {
	const { locals } = event;
	try {
		const database = connectDatabaseClient();
		const vUserRole = initVUserRoleRepository(database);
		const user = await initUserRepository(database, vUserRole);

		locals.repositories = {
			user,vUserRole
		}
	} catch (e) {
		console.error('Database:', e);
	}
};

const handleDockerApi = async (event: RequestEvent) => {
	const { locals } = event;
	try {
		const client = initDockerClient();
		const network = await initDockerNetwork(client);
		const container = initContainerFetchClient(client, network);

		locals.docker = {
			network, container
		}
	} catch (e) {
		console.error('Docker:', e);
	}
};

export const handle: Handle = async ({ event, resolve }) => {
	handleAuthentication(event);
	await handleDatabase(event);
	await handleDockerApi(event);
	await handleCurrentUser(event);

	return resolve(event);
};

