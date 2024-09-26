import Docker from 'dockerode';

const DockerClient = new Docker({socketPath: '/var/run/docker.sock'});

export default DockerClient