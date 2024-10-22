import type { Network, ContainerInfo, Container, ContainerCreateOptions, EndpointsConfig } from 'dockerode';
import Dockerode from 'dockerode';

export class ContainerClient {

	private readonly networkConfig: { EndpointsConfig: EndpointsConfig }
	constructor(private client: Dockerode, private network: Network) {
		this.networkConfig = {
			EndpointsConfig: {
				pocket_dimension: {
					NetworkID: network.id,
				}
			}
		}
	}

	async listAllContainers(): Promise<ContainerInfo> {
		return new Promise((resolve, reject) => {
				this.client.listContainers({ all: true }, (error, result) => {
					if (error) {
						reject(error);
						return;
					} else {
						resolve(result);
					}
				});
			}
		);
	}

	async createContainer(options: ContainerCreateOptions): Promise<Container> {
		return new Promise((resolve, reject) => {
        this.client.createContainer({...options, NetworkingConfig: this.networkConfig}, (error, container) => {
            if (error) {
                reject(error);
                return;
            } else {
                resolve(container);
            }
        });
    });
	}

	async getContainer(id: string): Promise<Container> {
		return new Promise((resolve, reject) => {
			this.client.getContainer(id).inspect((error, data) => {
				if (error) {
					reject(error);
					return;
				} else {
					resolve(data);
				}
			});
		});
	}

	async startContainer(id: string): Promise<Container> {
		return new Promise((resolve, reject) => {
			const container = this.client.getContainer(id);
			container.start((error, data) => {
				if (error) {
					reject(error);
					return;
				} else {
					resolve(data);
				}
			});
		});
	}

	async stopContainer(id: string): Promise<Container> {
		return new Promise((resolve, reject) => {
			const container = this.client.getContainer(id);
			container.stop((error, data) => {
				if (error) {
					reject(error);
					return;
				} else {
					resolve(data);
				}
			});
		});
	}

	async restartContainer(id: string): Promise<Container> {
		return new Promise((resolve, reject) => {
			const container = this.client.getContainer(id);
			container.restart((error, data) => {
				if (error) {
					reject(error);
					return;
				} else {
					resolve(data);
				}
			});
		});
	}
}

let containerFetchClient

export const initContainerFetchClient = (client: Dockerode, network: Network) => {
	if(containerFetchClient) {
		return containerFetchClient
	}

	containerFetchClient = new ContainerClient(client, network)
	return containerFetchClient
}