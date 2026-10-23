// Serves a small game catalog for the integration tests, standing in for GitHub.
import { createServer } from 'node:http';

const catalog = {
	schemaVersion: 1,
	games: [
		{
			version: 1,
			slug: 'community-test-game',
			name: 'Community Test Game',
			description: 'Comes from the online catalog.',
			image: 'example/community-test:1.0',
			ports: [{ container: 7777, protocol: 'udp', label: 'Game' }],
			env: [],
			volumes: [{ container: '/data' }]
		}
	]
};

createServer((request, response) => {
	if (request.url === '/catalog.json') {
		response.writeHead(200, { 'content-type': 'application/json' });
		response.end(JSON.stringify(catalog));
	} else {
		response.writeHead(404).end();
	}
}).listen(Number(process.env.PORT || 4174));
