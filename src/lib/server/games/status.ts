import type Docker from 'dockerode';
import type { ContainerStats } from 'dockerode';
import { GameDig } from 'gamedig';
import type {
	GameRepository,
	GameServerRecord
} from '#lib/server/database/repository/game.repository.ts';
import type {
	GameTemplate,
	ServerLiveStatus,
	ServerQueryInfo,
	ServerResources
} from '#lib/games/types.ts';
import { NETWORK_NAME } from '#lib/server/docker/constante.ts';
import { config } from '#lib/server/config.ts';

/** Live data is reused for this long before the server is asked again. */
const CACHE_MS = 10_000;
/** A page waits at most this long for a server's first status. */
const WAIT_MS = 4_000;
const MAX_PLAYER_NAMES = 100;

/** CPU and memory usage the way `docker stats` computes them. */
export function computeResources(stats: ContainerStats, memoryLimit: number): ServerResources {
	const cpuDelta =
		(stats.cpu_stats?.cpu_usage?.total_usage ?? 0) -
		(stats.precpu_stats?.cpu_usage?.total_usage ?? 0);
	const systemDelta =
		(stats.cpu_stats?.system_cpu_usage ?? 0) - (stats.precpu_stats?.system_cpu_usage ?? 0);
	const cpus =
		stats.cpu_stats?.online_cpus || stats.cpu_stats?.cpu_usage?.percpu_usage?.length || 1;
	const cpuPercent = cpuDelta > 0 && systemDelta > 0 ? (cpuDelta / systemDelta) * cpus * 100 : 0;

	const memory = stats.memory_stats ?? {};
	const inactive = (memory.stats as Record<string, number> | undefined) ?? {};
	const cache = inactive.inactive_file ?? inactive.total_inactive_file ?? 0;
	const memoryBytes = Math.max(0, (memory.usage ?? 0) - cache);

	return {
		cpuPercent: Math.round(cpuPercent * 10) / 10,
		memoryBytes,
		// Docker reports the host's memory in the stats when the container has no limit.
		memoryLimitBytes: memoryLimit > 0 ? memoryLimit : null
	};
}

function timeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
	return Promise.race([
		promise,
		new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms).unref())
	]);
}

/**
 * Collects player counts and resource usage of running game servers. Results
 * are cached briefly, so frequent page refreshes do not flood the games with
 * queries.
 */
export class StatusMonitor {
	private cache = new Map<number, { at: number; value: ServerLiveStatus | null }>();
	private inflight = new Map<number, Promise<ServerLiveStatus | null>>();

	constructor(
		private games: GameRepository,
		private docker: Docker
	) {}

	/** Live status by server id; servers that are not running have none. */
	async live(servers: GameServerRecord[]): Promise<Record<number, ServerLiveStatus>> {
		this.prune();
		const entries = await Promise.all(
			servers.map(async (server) => [server.id, await this.forServer(server)] as const)
		);
		const result: Record<number, ServerLiveStatus> = {};
		for (const [id, status] of entries) {
			if (status) result[id] = status;
		}
		return result;
	}

	private async forServer(server: GameServerRecord): Promise<ServerLiveStatus | null> {
		if (!server.containerId || server.status !== 'ready') return null;

		const cached = this.cache.get(server.id);
		if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

		let refresh = this.inflight.get(server.id);
		if (!refresh) {
			refresh = this.refresh(server)
				.catch((e) => {
					console.warn(`Live status of server ${server.id} failed:`, (e as Error)?.message ?? e);
					return null;
				})
				.then((value) => {
					this.cache.set(server.id, { at: Date.now(), value });
					return value;
				})
				.finally(() => this.inflight.delete(server.id));
			this.inflight.set(server.id, refresh);
		}

		// Older data is shown right away while the refresh runs in the background.
		if (cached) return cached.value;
		return (await timeout(refresh, WAIT_MS)) ?? null;
	}

	private async refresh(server: GameServerRecord): Promise<ServerLiveStatus | null> {
		const container = this.docker.getContainer(server.containerId!);
		const info = await container.inspect();
		if (!info.State.Running) return null;

		const template = await this.games.findTemplateById(server.templateId);
		const ip = info.NetworkSettings.Networks?.[NETWORK_NAME]?.IPAddress || null;

		const [resources, query] = await Promise.all([
			container
				.stats({ stream: false })
				.then((stats) => computeResources(stats, info.HostConfig.Memory ?? 0))
				.catch(() => null),
			template?.query ? this.query(server, template, ip) : Promise.resolve(undefined)
		]);

		return {
			queryState: query === undefined ? 'unsupported' : query ? 'ok' : 'unreachable',
			query: query ?? null,
			resources,
			startedAt: info.State.StartedAt || null
		};
	}

	/**
	 * Asks the game for its status. The container is tried on its address in the
	 * PocketDimension network and on its published port at the same time, so this
	 * works whether the app runs on the host or in a container.
	 */
	private async query(
		server: GameServerRecord,
		template: GameTemplate,
		containerIp: string | null
	): Promise<ServerQueryInfo | null> {
		const port = template.ports[template.query!.port];
		if (!port) return null;

		const targets = [{ host: config.games.queryHost, port: port.container + server.portOffset }];
		if (containerIp) targets.unshift({ host: containerIp, port: port.container });

		try {
			const result = await Promise.any(
				targets.map((target) =>
					GameDig.query({
						type: template.query!.type,
						host: target.host,
						port: target.port,
						givenPortOnly: true,
						socketTimeout: 1500,
						attemptTimeout: 3000,
						maxRetries: 1
					})
				)
			);
			return {
				name: String(result.name ?? ''),
				map: String(result.map ?? ''),
				version: String(result.version ?? ''),
				players: result.numplayers ?? result.players?.length ?? 0,
				maxPlayers: result.maxplayers ?? 0,
				playerNames: (result.players ?? [])
					.map((p) => p.name)
					.filter((name): name is string => typeof name === 'string' && name !== '')
					.slice(0, MAX_PLAYER_NAMES),
				passwordProtected: result.password === true,
				ping: result.ping ?? 0
			};
		} catch {
			return null;
		}
	}

	/** Drops cached data, e.g. after the server was started or stopped. */
	forget(id: number) {
		this.cache.delete(id);
	}

	/** Forgets old entries, e.g. of deleted servers. */
	private prune() {
		for (const [id, entry] of this.cache) {
			if (Date.now() - entry.at > 5 * 60_000) this.cache.delete(id);
		}
	}
}
