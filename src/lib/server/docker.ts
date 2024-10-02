import Docker from 'dockerode';
import * as console from 'console';

const DockerClient = new Docker({socketPath: '/var/run/docker.sock'});

DockerClient.listNetworks((error, result) => {
	if (error) {
      console.error(error);
  } else {
      console.log(result);
  }
})


export default DockerClient