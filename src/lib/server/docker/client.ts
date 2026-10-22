import Docker from 'dockerode';
import type { Network } from 'dockerode';
import { NETWORK_NAME } from '#lib/server/docker/constante.ts';

let client: Docker | undefined;

/**
 * Connects to the Docker API. Uses DOCKER_HOST when set (for example a
 * docker-socket-proxy that only allows the endpoints PocketDimension needs),
 * otherwise the local socket.
 */
export const initDockerClient = (): Docker => {
	client ??= new Docker();
	return client;
};

const ICC_OPTION = 'com.docker.network.bridge.enable_icc';

let network: Promise<Network> | undefined;

export const initDockerNetwork = (client: Docker): Promise<Network> => {
	network ??= (async () => {
		const networks = await client.listNetworks({ filters: { name: [NETWORK_NAME] } });
		const existing = networks.find((n) => n.Name === NETWORK_NAME);
		if (existing) {
			if (existing.Options?.[ICC_OPTION] !== 'false') {
				console.warn(
					`${NETWORK_NAME} lets game servers reach each other. Recreate it to isolate them (see the manual).`
				);
			}
			return client.getNetwork(existing.Id);
		}
		const created = await client.createNetwork({
			Name: NETWORK_NAME,
			// Game servers of different users must not reach each other's unpublished ports (RCON, admin consoles).
			Options: { [ICC_OPTION]: 'false' }
		});
		console.log('Created Pocket Dimension network', created.id);
		return created;
	})();

	network.catch(() => (network = undefined));
	return network;
};
