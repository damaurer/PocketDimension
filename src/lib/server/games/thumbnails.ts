import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { GameRepository, Thumbnail } from '#lib/server/database/repository/game.repository.ts';
import { isPrivateAddress, publicFetch, readLimited } from '#lib/server/http.ts';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;
/** A failed download is tried again after this time. */
const RETRY_MS = 60 * 60 * 1000;

export type Resolver = (host: string) => Promise<string[]>;

const resolveHost: Resolver = async (host) =>
	(await lookup(host, { all: true })).map((entry) => entry.address);

/** Recognises the image formats browsers show, from the first bytes. SVG is never accepted. */
export function sniffImageType(data: Uint8Array): string | undefined {
	const ascii = (start: number, end: number) => String.fromCharCode(...data.subarray(start, end));
	if (data[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
	if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg';
	if (ascii(0, 4) === 'GIF8') return 'image/gif';
	if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
	if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
	return undefined;
}

/**
 * Downloads a thumbnail over https. Redirects are followed and checked like the
 * first address; `publicFetch` checks the address again when it connects.
 */
export async function downloadThumbnail(
	address: string,
	fetcher: typeof fetch = publicFetch,
	resolver: Resolver = resolveHost
): Promise<Thumbnail> {
	let url = new URL(address);
	for (let redirects = 0; ; redirects++) {
		if (url.protocol !== 'https:') throw new Error('Thumbnails are only loaded over https.');
		const host = url.hostname.replace(/^\[|\]$/g, '');
		const addresses = isIP(host) ? [host] : await resolver(host);
		if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
			throw new Error('Thumbnails are not loaded from the local network.');
		}

		const response = await fetcher(url, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
			headers: { accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif' },
			credentials: 'omit',
			redirect: 'manual'
		});
		const location = response.headers.get('location');
		if (response.status >= 300 && response.status < 400 && location) {
			if (redirects >= MAX_REDIRECTS) throw new Error('The thumbnail redirects too often.');
			await response.body?.cancel();
			url = new URL(location, url);
			continue;
		}
		if (!response.ok) throw new Error(`The thumbnail answered with HTTP ${response.status}.`);

		const data = await readLimited(response, MAX_BYTES, 'The thumbnail is larger than 1 MB.');
		const contentType = sniffImageType(data);
		if (!contentType) throw new Error('The thumbnail is not a PNG, JPEG, WebP, GIF or AVIF image.');
		return { contentType, data: Buffer.from(data) };
	}
}

/**
 * Serves game thumbnails from the database and downloads missing ones once,
 * so players' browsers only ever talk to this app.
 */
export class ThumbnailStore {
	private loading = new Map<string, Promise<Thumbnail | undefined>>();
	private failedAt = new Map<string, number>();

	constructor(
		private games: GameRepository,
		private fetcher: typeof fetch = publicFetch,
		private resolver: Resolver = resolveHost
	) {}

	async get(url: string): Promise<Thumbnail | undefined> {
		const stored = await this.games.findThumbnail(url);
		if (stored) return stored;
		if (Date.now() - (this.failedAt.get(url) ?? -Infinity) < RETRY_MS) return undefined;

		let loading = this.loading.get(url);
		if (!loading) {
			loading = this.download(url).finally(() => this.loading.delete(url));
			this.loading.set(url, loading);
		}
		return loading;
	}

	private async download(url: string): Promise<Thumbnail | undefined> {
		try {
			const thumbnail = await downloadThumbnail(url, this.fetcher, this.resolver);
			await this.games.saveThumbnail(url, thumbnail);
			this.failedAt.delete(url);
			return thumbnail;
		} catch (e) {
			console.warn(`Thumbnail ${url}:`, (e as Error).message);
			this.failedAt.set(url, Date.now());
			return undefined;
		}
	}
}

const escapeXml = (text: string) => text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A picture with the game's initials for games without (a loadable) thumbnail. */
export function placeholderThumbnail(slug: string, name: string): string {
	let hash = 0;
	for (const c of slug) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
	const hue = hash % 360;
	const initials = name
		.split(/[\s:-]+/)
		.filter((word) => /^[\p{L}\p{N}]/u.test(word))
		.slice(0, 2)
		.map((word) => [...word][0].toUpperCase())
		.join('');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="215" viewBox="0 0 460 215">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue} 55% 42%)"/><stop offset="1" stop-color="hsl(${(hue + 50) % 360} 60% 22%)"/>
</linearGradient></defs>
<rect width="460" height="215" fill="url(#g)"/>
<text x="230" y="108" fill="#fff" fill-opacity="0.9" font-family="system-ui, sans-serif" font-size="88" font-weight="700" text-anchor="middle" dominant-baseline="central">${escapeXml(initials)}</text>
</svg>`;
}
