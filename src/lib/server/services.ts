import { connectDatabaseClient } from '#lib/server/database/client.ts';
import {
	ensureAdminUser,
	UserRepository
} from '#lib/server/database/repository/user.repository.ts';
import { GameRepository } from '#lib/server/database/repository/game.repository.ts';
import { initDockerClient, initDockerNetwork } from '#lib/server/docker/client.ts';
import {
	initContainerClient,
	type ContainerClient
} from '#lib/server/docker/api/container.client.ts';
import { ServerManager } from '#lib/server/games/servers.ts';
import { StatusMonitor } from '#lib/server/games/status.ts';
import { BUILTIN_TEMPLATES } from '#lib/server/games/catalog.ts';
import { CatalogSync } from '#lib/server/games/catalogSync.ts';
import { hashPassword } from '#lib/server/security/authentication.ts';
import { config } from '#lib/server/config.ts';

export interface Repositories {
	user: UserRepository;
	games: GameRepository;
}

let repositories: Promise<Repositories> | undefined;

export function getRepositories(): Promise<Repositories> {
	repositories ??= (async () => {
		const database = await connectDatabaseClient();
		const user = new UserRepository(database);
		const games = new GameRepository(database);
		await ensureAdminUser(user, config.admin, hashPassword);
		await games.syncCatalog(BUILTIN_TEMPLATES, { enableNew: true });
		return { user, games };
	})();
	repositories.catch(() => (repositories = undefined));
	return repositories;
}

export async function getContainerClient(): Promise<ContainerClient> {
	const client = initDockerClient();
	const network = await initDockerNetwork(client);
	return initContainerClient(client, network);
}

let serverManager: Promise<ServerManager> | undefined;

export function getServerManager(): Promise<ServerManager> {
	serverManager ??= (async () => {
		const { games } = await getRepositories();
		const manager = new ServerManager(games, initDockerClient(), await getContainerClient());
		await manager.resumeInterrupted();
		return manager;
	})();
	serverManager.catch(() => (serverManager = undefined));
	return serverManager;
}

let statusMonitor: Promise<StatusMonitor> | undefined;

export function getStatusMonitor(): Promise<StatusMonitor> {
	statusMonitor ??= (async () => {
		const { games } = await getRepositories();
		return new StatusMonitor(games, initDockerClient());
	})();
	statusMonitor.catch(() => (statusMonitor = undefined));
	return statusMonitor;
}

let catalogSync: Promise<CatalogSync> | undefined;

export function getCatalogSync(): Promise<CatalogSync> {
	catalogSync ??= (async () => {
		const { games } = await getRepositories();
		return new CatalogSync(games, config.catalog.url);
	})();
	catalogSync.catch(() => (catalogSync = undefined));
	return catalogSync;
}
