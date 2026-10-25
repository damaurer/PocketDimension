import type Docker from 'dockerode';
import type { ContainerCreateOptions, ContainerInfo, Network } from 'dockerode';
import { MANAGED_LABEL, NETWORK_NAME } from '#lib/server/docker/constante.ts';
import { ContainerStatus } from '#lib/types.ts';

const CONTAINER_ID = /^[a-f0-9]{12,64}$/;

export function isContainerId(id: unknown): id is string {
	return typeof id === 'string' && CONTAINER_ID.test(id);
}

/** Docker answers 304 when a container already is in the requested state. */
export function isNotModified(e: unknown): boolean {
	return (e as { statusCode?: number })?.statusCode === 304;
}

export class ContainerNotFoundError extends Error {
	constructor(id: string) {
		super(`Container ${id} is not managed by PocketDimension.`);
	}
}

/**
 * Access to the containers PocketDimension may manage: containers it created
 * (labelled) and containers an operator attached to the PocketDimension network.
 * Every other container on the host is invisible to the app.
 */
export class ContainerClient {
	constructor(
		private client: Docker,
		private network: Network
	) {}

	async listManagedContainers(): Promise<ContainerInfo[]> {
		const [labelled, attached] = await Promise.all([
			this.client.listContainers({ all: true, filters: { label: [`${MANAGED_LABEL}=true`] } }),
			this.client.listContainers({ all: true, filters: { network: [NETWORK_NAME] } })
		]);
		const byId = new Map<string, ContainerInfo>();
		for (const container of [...labelled, ...attached]) {
			byId.set(container.Id, container);
		}
		return [...byId.values()];
	}

	async createContainer(options: ContainerCreateOptions) {
		return this.client.createContainer({
			...options,
			Labels: { ...options.Labels, [MANAGED_LABEL]: 'true' },
			NetworkingConfig: {
				EndpointsConfig: { [NETWORK_NAME]: { NetworkID: this.network.id } }
			}
		});
	}

	async changeStatus(id: string, status: ContainerStatus): Promise<void> {
		await this.assertManaged(id);
		const container = this.client.getContainer(id);
		try {
			switch (status) {
				case ContainerStatus.START:
					await container.start();
					break;
				case ContainerStatus.STOP:
					await container.stop();
					break;
				case ContainerStatus.RESTART:
					await container.restart();
					break;
			}
		} catch (e) {
			if (!isNotModified(e)) throw e;
		}
	}

	private async assertManaged(id: string) {
		const containers = await this.listManagedContainers();
		if (!containers.some((c) => c.Id === id || c.Id.startsWith(id))) {
			throw new ContainerNotFoundError(id);
		}
	}
}

let containerClient: ContainerClient | undefined;

export const initContainerClient = (client: Docker, network: Network): ContainerClient => {
	containerClient ??= new ContainerClient(client, network);
	return containerClient;
};
