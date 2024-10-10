import database from '$lib/server/database/database';
import DockerClient from '$lib/server/config/docker';

export async function getAllNetworks() {
	return DockerClient.listNetworks()
}
