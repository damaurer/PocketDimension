import Docker from 'dockerode';
import type { Network } from 'dockerode'
import { NETWORK_NAME } from '$lib/server/docker/constante';
import Dockerode from 'dockerode';


const socketPath = process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock'

let client;

export const initDockerClient = (): Dockerode => {
	if(client) {
		return client
	}
	client = new Docker({ socketPath: socketPath });

	return client
}

let network;

export const initDockerNetwork = async (client: Dockerode): Promise<Network> => {
	if (network) {
		return network
	}

	const networksInspectInfos = await client.listNetworks();
	const networksInspectInfo = networksInspectInfos.find(nii => nii.Name === NETWORK_NAME);
	if (!networksInspectInfo) {
		const network: Network = await client.createNetwork({
			Name: NETWORK_NAME
		});
		if (network) {
			console.log('Create Pocket Dimension Network', network.id);
		}
		return network;
	}

	console.log('Found Pocket Dimension Network', networksInspectInfo.Id);

	return client.getNetwork(networksInspectInfo.Id);
}

