// Production entry point. Wraps the adapter-node handler so the app works both
// behind a TLS reverse proxy and when it is opened directly over plain http
// (for example http://192.168.0.10:3000 in a home network).
//
// SvelteKit derives the request origin from the Host header and the protocol
// header below. adapter-node assumes https when that header is missing, which
// would break form submissions (CSRF origin check) on plain http.
//
// Environment:
//   ORIGIN          Optional fixed public origin, e.g. https://games.example.com.
//                   When set, Host and protocol headers from clients are ignored.
//   HOST, PORT      Listen address (default 0.0.0.0:3000).
//   ADDRESS_HEADER  e.g. X-Forwarded-For when behind a proxy, so login rate
//   XFF_DEPTH       limiting sees the real client address.
import http from 'node:http';
import process from 'node:process';

const PROTOCOL_HEADER = 'x-forwarded-proto';
process.env.PROTOCOL_HEADER ||= PROTOCOL_HEADER;
const protocolHeader = process.env.PROTOCOL_HEADER.toLowerCase();

const origin = process.env.ORIGIN ? new URL(process.env.ORIGIN) : undefined;

const { handler } = await import('./build/handler.js');

const server = http.createServer((req, res) => {
	if (origin) {
		req.headers.host = origin.host;
		req.headers[protocolHeader] = origin.protocol.slice(0, -1);
	} else if (!req.headers[protocolHeader]) {
		req.headers[protocolHeader] = 'http';
	}
	handler(req, res, () => {
		res.statusCode = 404;
		res.end('Not found');
	});
});

const host = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);

server.listen(port, host, () => {
	console.log(`Listening on http://${host}:${port}`);
});

function shutdown() {
	server.close(() => process.exit(0));
	setTimeout(() => process.exit(0), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
