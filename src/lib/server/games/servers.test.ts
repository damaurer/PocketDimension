import { readFileSync } from 'node:fs';
import sqlite3 from 'sqlite3';
import type Docker from 'dockerode';
import { describe, expect, it } from 'vitest';
import { Database } from '#lib/server/database/client.ts';
import { GameRepository } from '#lib/server/database/repository/game.repository.ts';
import type { ContainerClient } from '#lib/server/docker/api/container.client.ts';
import type { GameTemplateInput } from '#lib/games/types.ts';
import { ServerManager } from './servers';

const game: GameTemplateInput = {
	slug: 'test-game',
	name: 'Test game',
	description: '',
	image: 'example/test:1.0',
	ports: [{ container: 7777, protocol: 'udp' }],
	env: [],
	volumes: [],
	memoryMb: null,
	query: null,
	docsUrl: null,
	thumbnailUrl: null
};

async function setup() {
	const database = new Database(new sqlite3.Database(':memory:'));
	await database.exec(readFileSync('database/initial.sql', 'utf8'));
	await database.run("INSERT INTO User (id, email, password) VALUES (1, 'a@example.com', '')");
	const games = new GameRepository(database);
	const template = (await games.findTemplateById(await games.createTemplate(game)))!;
	const addServer = async (containerId: string) => {
		const id = await games.createServer({
			name: 'Server',
			ownerId: 1,
			templateId: template.id,
			portOffset: 0,
			env: {}
		});
		await games.setServerContainer(id, containerId);
		await games.setServerStatus(id, 'ready');
		return id;
	};
	return { games, template, addServer };
}

interface FakeContainer {
	Id: string;
	State: string;
	PortBindings?: Record<string, { HostPort: string }[]>;
}

/** Just enough of dockerode for the server manager; provisioning always fails. */
function fakeDocker(
	containers: FakeContainer[],
	options: { error?: { statusCode: number }; listError?: Error } = {}
) {
	const fail = async () => {
		throw options.error ?? new Error('not available');
	};
	return {
		listContainers: async () => {
			if (options.listError) throw options.listError;
			// Docker lists no ports for containers that are not running.
			return containers.map(({ Id, State }) => ({ Id, State, Ports: [], Labels: {} }));
		},
		getContainer: (id: string) => ({
			inspect: async () => ({
				HostConfig: { PortBindings: containers.find((c) => c.Id === id)?.PortBindings ?? {} },
				State: { Running: false }
			}),
			start: fail,
			stop: fail,
			restart: fail
		}),
		getImage: () => ({ inspect: fail }),
		pull: (_image: string, callback: (e: Error) => void) => callback(new Error('offline'))
	} as unknown as Docker;
}

const owner = { id: 1, isAdmin: true };

describe('ServerManager ports', () => {
	it('does not hand out the ports of a stopped server again', async () => {
		const { games, template, addServer } = await setup();
		await addServer('abc123abc123');
		const docker = fakeDocker([{ Id: 'abc123abc123', State: 'exited' }]);
		const manager = new ServerManager(games, docker, {} as ContainerClient);

		const id = await manager.create(owner, template, 'Second', {});
		expect((await games.findServer(id))!.portOffset).toBe(10);
	});

	it('keeps clear of ports bound by stopped containers of other apps', async () => {
		const { games, template } = await setup();
		const docker = fakeDocker([
			{ Id: 'def456def456', State: 'exited', PortBindings: { '7777/udp': [{ HostPort: '7777' }] } }
		]);
		const manager = new ServerManager(games, docker, {} as ContainerClient);

		const id = await manager.create(owner, template, 'Server', {});
		expect((await games.findServer(id))!.portOffset).toBe(10);
	});
});

describe('ServerManager actions', () => {
	it('treats starting a running or stopping a stopped server as done', async () => {
		const { games, addServer } = await setup();
		const server = (await games.findServer(await addServer('abc123abc123')))!;

		const notModified = fakeDocker([], { error: { statusCode: 304 } });
		const manager = new ServerManager(games, notModified, {} as ContainerClient);
		await expect(manager.action(server, 'stop')).resolves.toBeUndefined();
		await expect(manager.action(server, 'start')).resolves.toBeUndefined();

		const broken = fakeDocker([], { error: { statusCode: 500 } });
		await expect(
			new ServerManager(games, broken, {} as ContainerClient).action(server, 'start')
		).rejects.toBeDefined();
	});

	it('reports an unreachable Docker instead of showing every container as gone', async () => {
		const { games, addServer } = await setup();
		await addServer('abc123abc123');
		const docker = fakeDocker([], { listError: new Error('connect ENOENT /var/run/docker.sock') });
		const manager = new ServerManager(games, docker, {} as ContainerClient);

		await expect(manager.views(await games.listServers())).rejects.toThrow('ENOENT');
	});
});
