import { connectDatabaseClient } from '#lib/server/database/client.ts';
import {
	ensureAdminUser,
	UserRepository
} from '#lib/server/database/repository/user.repository.ts';
import { initDockerClient, initDockerNetwork } from '#lib/server/docker/client.ts';
import {
	initContainerClient,
	type ContainerClient
} from '#lib/server/docker/api/container.client.ts';
import { hashPassword } from '#lib/server/security/authentication.ts';
import { config } from '#lib/server/config.ts';

let repositories: Promise<{ user: UserRepository }> | undefined;

export function getRepositories() {
	repositories ??= (async () => {
		const database = await connectDatabaseClient();
		const user = new UserRepository(database);
		await ensureAdminUser(user, config.admin, hashPassword);
		return { user };
	})();
	repositories.catch(() => (repositories = undefined));
	return repositories;
}

export async function getContainerClient(): Promise<ContainerClient> {
	const client = initDockerClient();
	const network = await initDockerNetwork(client);
	return initContainerClient(client, network);
}
