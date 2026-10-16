import type Docker from 'dockerode';
import type { ContainerInfo } from 'dockerode';
import type {
	GameRepository,
	GameServerRecord
} from '#lib/server/database/repository/game.repository.ts';
import type { ContainerClient } from '#lib/server/docker/api/container.client.ts';
import type { GameServerView, GameTemplate, Protocol } from '#lib/games/types.ts';
import { allocatePortOffset, portKey } from '#lib/server/games/validation.ts';
import { config } from '#lib/server/config.ts';

export const SERVER_LABEL = 'pocketdimension.server';
const OWNER_LABEL = 'pocketdimension.owner';
const TEMPLATE_LABEL = 'pocketdimension.template';

export class ServerLimitError extends Error {}
export class NoFreePortsError extends Error {}

export type ServerAction = 'start' | 'stop' | 'restart';

const volumeName = (serverId: number, index: number) =>
	`pocketdimension-server-${serverId}-${index}`;

/** Serializes async work, so two creates cannot pick the same ports. */
class Lock {
	private tail: Promise<unknown> = Promise.resolve();
	run<T>(work: () => Promise<T>): Promise<T> {
		const result = this.tail.then(work, work);
		this.tail = result.catch(() => undefined);
		return result;
	}
}

function shortError(e: unknown): string {
	const message = (e as { json?: { message?: string } })?.json?.message ?? (e as Error)?.message;
	return String(message ?? e).slice(0, 300);
}

export class ServerManager {
	private lock = new Lock();
	private provisioning = new Set<number>();

	constructor(
		private games: GameRepository,
		private docker: Docker,
		private containers: ContainerClient
	) {}

	/** Host ports taken by any container on the host or reserved by a server still being created. */
	private async usedHostPorts(): Promise<Set<string>> {
		const used = new Set<string>();
		const all = await this.docker.listContainers({ all: true });
		for (const container of all) {
			for (const port of container.Ports) {
				if (port.PublicPort) used.add(portKey(port.PublicPort, port.Type as Protocol));
			}
		}
		for (const server of await this.games.listServers()) {
			if (server.containerId) continue;
			const template = await this.games.findTemplateById(server.templateId);
			for (const port of template?.ports ?? []) {
				used.add(portKey(port.container + server.portOffset, port.protocol));
			}
		}
		return used;
	}

	async create(
		owner: { id: number; isAdmin: boolean },
		template: GameTemplate,
		name: string,
		env: Record<string, string>
	): Promise<number> {
		const id = await this.lock.run(async () => {
			if (
				!owner.isAdmin &&
				(await this.games.countServers(owner.id)) >= config.games.maxServersPerUser
			) {
				throw new ServerLimitError(
					`You can have at most ${config.games.maxServersPerUser} servers. Delete one first.`
				);
			}

			const offset = allocatePortOffset(
				template.ports,
				await this.usedHostPorts(),
				config.games.portOffsetStep
			);
			if (offset === undefined) throw new NoFreePortsError('No free ports left on this host.');

			return this.games.createServer({
				name,
				ownerId: owner.id,
				templateId: template.id,
				portOffset: offset,
				env
			});
		});

		void this.provision(id);
		return id;
	}

	/** Pulls the image, creates and starts the container. Safe to call again after a failure. */
	async provision(id: number): Promise<void> {
		if (this.provisioning.has(id)) return;
		this.provisioning.add(id);
		try {
			const server = await this.games.findServer(id);
			const template = server && (await this.games.findTemplateById(server.templateId));
			if (!server || !template) return;

			if (server.containerId && !(await this.containerExists(server.containerId))) {
				server.containerId = null;
			}

			if (!server.containerId) {
				await this.games.setServerStatus(id, 'pulling');
				await this.pullOrUseLocal(template.image);

				// The server may have been deleted while the image was downloading.
				if (!(await this.games.findServer(id))) return;

				await this.games.setServerStatus(id, 'creating');
				const container = await this.containers.createContainer(
					this.containerOptions(server, template)
				);
				if (!(await this.games.findServer(id))) {
					await this.removeDockerResources(id, container.id, template.volumes.length);
					return;
				}
				await this.games.setServerContainer(id, container.id);
			}

			const fresh = (await this.games.findServer(id))!;
			const info = await this.docker.getContainer(fresh.containerId!).inspect();
			if (!info.State.Running) {
				await this.docker.getContainer(fresh.containerId!).start();
			}
			await this.games.setServerStatus(id, 'ready');
		} catch (e) {
			console.error(`Provisioning server ${id} failed:`, e);
			await this.games.setServerStatus(id, 'error', shortError(e)).catch(() => undefined);
		} finally {
			this.provisioning.delete(id);
		}
	}

	/** Restarts provisioning that was cut short by an app restart. */
	async resumeInterrupted(): Promise<void> {
		const pending = await this.games.listServersWithStatus(['pending', 'pulling', 'creating']);
		for (const server of pending) void this.provision(server.id);
	}

	private async containerExists(id: string): Promise<boolean> {
		try {
			await this.docker.getContainer(id).inspect();
			return true;
		} catch (e) {
			if ((e as { statusCode?: number })?.statusCode === 404) return false;
			throw e;
		}
	}

	/** Pulls the newest image; falls back to a local copy when the registry is unreachable or rate limited. */
	private async pullOrUseLocal(image: string): Promise<void> {
		try {
			await this.pull(image);
		} catch (e) {
			const local = await this.docker
				.getImage(image)
				.inspect()
				.catch(() => undefined);
			if (!local) throw e;
			console.warn(`Pulling ${image} failed, using the local image:`, shortError(e));
		}
	}

	private pull(image: string): Promise<void> {
		return new Promise((resolve, reject) => {
			this.docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
				if (err) return reject(err);
				this.docker.modem.followProgress(stream, (error: Error | null) =>
					error ? reject(error) : resolve()
				);
			});
		});
	}

	private containerOptions(server: GameServerRecord, template: GameTemplate) {
		const exposed: Record<string, object> = {};
		const bindings: Record<string, { HostIp?: string; HostPort: string }[]> = {};
		for (const port of template.ports) {
			const key = portKey(port.container, port.protocol);
			exposed[key] = {};
			bindings[key] = [
				{
					...(config.games.portBindIp ? { HostIp: config.games.portBindIp } : {}),
					HostPort: String(port.container + server.portOffset)
				}
			];
		}

		return {
			name: `pocketdimension-${template.slug}-${server.id}`,
			Image: template.image,
			Env: Object.entries(server.env).map(([key, value]) => `${key}=${value}`),
			ExposedPorts: exposed,
			Labels: {
				[SERVER_LABEL]: String(server.id),
				[OWNER_LABEL]: String(server.ownerId),
				[TEMPLATE_LABEL]: template.slug
			},
			HostConfig: {
				PortBindings: bindings,
				Mounts: template.volumes.map((volume, index) => ({
					Type: 'volume' as const,
					Source: volumeName(server.id, index),
					Target: volume.container
				})),
				RestartPolicy: { Name: 'unless-stopped' },
				...(template.memoryMb && config.games.enforceMemoryLimits
					? { Memory: template.memoryMb * 1024 * 1024 }
					: {}),
				SecurityOpt: ['no-new-privileges:true'],
				PidsLimit: 2048,
				LogConfig: { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '3' } }
			}
		};
	}

	async action(server: GameServerRecord, action: ServerAction): Promise<void> {
		if (!server.containerId) throw new Error('The server is not ready yet.');
		const container = this.docker.getContainer(server.containerId);
		if (action === 'start') await container.start();
		if (action === 'stop') await container.stop({ t: 30 });
		if (action === 'restart') await container.restart({ t: 30 });
	}

	/** Removes the container and the server's data volumes. */
	async remove(server: GameServerRecord): Promise<void> {
		const template = await this.games.findTemplateById(server.templateId);
		await this.removeDockerResources(server.id, server.containerId, template?.volumes.length ?? 0);
		await this.games.deleteServer(server.id);
	}

	private async removeDockerResources(
		serverId: number,
		containerId: string | null,
		volumeCount: number
	): Promise<void> {
		const ignoreMissing = (e: { statusCode?: number }) => {
			if (e?.statusCode !== 404) throw e;
		};
		if (containerId) {
			await this.docker.getContainer(containerId).remove({ force: true }).catch(ignoreMissing);
		}
		for (let index = 0; index < volumeCount; index++) {
			await this.docker.getVolume(volumeName(serverId, index)).remove().catch(ignoreMissing);
		}
	}

	/** Combines database rows with live Docker state. */
	async views(servers: GameServerRecord[]): Promise<GameServerView[]> {
		const byServer = new Map<number, ContainerInfo>();
		const containers = await this.docker
			.listContainers({ all: true, filters: { label: [SERVER_LABEL] } })
			.catch(() => [] as ContainerInfo[]);
		for (const container of containers) {
			byServer.set(Number(container.Labels[SERVER_LABEL]), container);
		}

		const views: GameServerView[] = [];
		for (const server of servers) {
			const template = await this.games.findTemplateById(server.templateId);
			const container = byServer.get(server.id);
			const ports = (template?.ports ?? []).map((p) => {
				const published = container?.Ports.find(
					(cp) => cp.PrivatePort === p.container && cp.Type === p.protocol && cp.PublicPort
				);
				return {
					host: published?.PublicPort ?? p.container + server.portOffset,
					protocol: p.protocol,
					label: p.label
				};
			});
			views.push({
				id: server.id,
				name: server.name,
				ownerId: server.ownerId,
				ownerName: server.ownerName,
				template: {
					id: server.templateId,
					slug: template?.slug ?? '',
					name: template?.name ?? '?'
				},
				status:
					server.containerId && !container && server.status === 'ready' ? 'error' : server.status,
				statusMessage:
					server.containerId && !container && server.status === 'ready'
						? 'The container no longer exists.'
						: server.statusMessage,
				state: container?.State ?? null,
				ports,
				createdAt: server.createdAt
			});
		}
		return views;
	}
}
