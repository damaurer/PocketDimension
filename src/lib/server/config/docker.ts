import Docker from 'dockerode';
import * as console from 'console';

const DockerClient = new Docker({socketPath: '/var/run/docker.sock'});

async function checkDockerConnection() {
	const networks = await DockerClient.listNetworks()
	if(networks) {
		console.log("Found Networks:", networks)
	}
}




checkDockerConnection().then(() => {
	console.log("Docker Connection Works")
}).catch(e => {console.error(e)})

export default DockerClient