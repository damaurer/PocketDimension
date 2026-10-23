import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { Readable } from 'node:stream';

/** Reads a response body, stopping as soon as it grows beyond `maxBytes` instead of buffering it all. */
export async function readLimited(
	response: Response,
	maxBytes: number,
	tooLarge: string
): Promise<Buffer> {
	if (Number(response.headers.get('content-length')) > maxBytes) throw new Error(tooLarge);
	const chunks: Uint8Array[] = [];
	let size = 0;
	for await (const chunk of response.body ?? []) {
		size += chunk.byteLength;
		// Leaving the loop early cancels the download.
		if (size > maxBytes) throw new Error(tooLarge);
		chunks.push(chunk);
	}
	return Buffer.concat(chunks);
}

// Addresses the app must not be pointed at when it downloads something on an admin's behalf.
const PRIVATE = new BlockList();
for (const [network, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 3]
] as const) {
	PRIVATE.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
	['::', 127],
	['64:ff9b::', 96],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8]
] as const) {
	PRIVATE.addSubnet(network, prefix, 'ipv6');
}

/** True for loopback, private, link-local and other addresses that are not on the public internet. */
export function isPrivateAddress(address: string): boolean {
	const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
	if (mapped) return PRIVATE.check(mapped[1], 'ipv4');
	return PRIVATE.check(address, isIP(address) === 6 ? 'ipv6' : 'ipv4');
}

export class PrivateAddressError extends Error {
	constructor() {
		super('Downloads from the local network are not allowed.');
	}
}

/** Resolves like the default lookup, but fails when any address is not public. */
const publicLookup: LookupFunction = (hostname, options, callback) => {
	lookup(hostname, { ...options, all: true })
		.then((entries) => {
			if (entries.length === 0 || entries.some((entry) => isPrivateAddress(entry.address))) {
				throw new PrivateAddressError();
			}
			if (options.all) callback(null, entries);
			else callback(null, entries[0].address, entries[0].family);
		})
		.catch((e: NodeJS.ErrnoException) => callback(e, ''));
};

/**
 * A `fetch` for public https addresses. The address is checked when the
 * connection is made, so a host name cannot resolve to a public address for a
 * check and to a local one for the request (DNS rebinding). Redirects are not
 * followed; callers check the next address themselves.
 */
export const publicFetch = ((input: string | URL, init: RequestInit = {}) =>
	new Promise<Response>((resolve, reject) => {
		const url = new URL(input);
		if (url.protocol !== 'https:') return reject(new Error('Only https addresses are allowed.'));
		// IP addresses are connected to without a lookup.
		const host = url.hostname.replace(/^\[|\]$/g, '');
		if (isIP(host) && isPrivateAddress(host)) return reject(new PrivateAddressError());

		const request = https.get(
			url,
			{
				headers: Object.fromEntries(new Headers(init.headers)),
				signal: init.signal ?? undefined,
				lookup: publicLookup
			},
			(response) => {
				const headers = new Headers();
				for (const [name, value] of Object.entries(response.headers)) {
					for (const item of [value ?? []].flat()) headers.append(name, item);
				}
				const status = response.statusCode ?? 502;
				const body = [204, 205, 304].includes(status)
					? null
					: (Readable.toWeb(response) as ReadableStream<Uint8Array>);
				resolve(new Response(body, { status, headers }));
			}
		);
		request.on('error', reject);
	})) as typeof fetch;
