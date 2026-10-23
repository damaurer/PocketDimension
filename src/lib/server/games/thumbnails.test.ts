import { readFileSync } from 'node:fs';
import sqlite3 from 'sqlite3';
import { describe, expect, it, vi } from 'vitest';
import { Database } from '#lib/server/database/client.ts';
import { GameRepository } from '#lib/server/database/repository/game.repository.ts';
import {
	downloadThumbnail,
	placeholderThumbnail,
	sniffImageType,
	ThumbnailStore
} from './thumbnails';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const publicHost = async () => ['93.184.215.14'];

const respond = (body: BodyInit | null, init: ResponseInit = {}) =>
	vi.fn(async () => new Response(body, init)) as unknown as typeof fetch;

describe('thumbnail download', () => {
	it('recognises images by their bytes, never SVG or HTML', () => {
		expect(sniffImageType(PNG)).toBe('image/png');
		expect(sniffImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
		expect(sniffImageType(Buffer.from('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
		expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe(
			undefined
		);
		expect(sniffImageType(Buffer.from('<!doctype html>'))).toBe(undefined);
	});

	it('loads an image and uses the sniffed type', async () => {
		const fetcher = respond(PNG, { headers: { 'content-type': 'text/html' } });
		const thumbnail = await downloadThumbnail('https://cdn.example.com/a.png', fetcher, publicHost);
		expect(thumbnail.contentType).toBe('image/png');
		expect(thumbnail.data.equals(PNG)).toBe(true);
	});

	it('refuses the local network, plain http and redirects there', async () => {
		const fetcher = respond(PNG);
		await expect(
			downloadThumbnail('https://intranet.example/a.png', fetcher, async () => ['10.0.0.5'])
		).rejects.toThrow(/local network/);
		await expect(downloadThumbnail('https://127.0.0.1/a.png', fetcher)).rejects.toThrow(
			/local network/
		);
		await expect(downloadThumbnail('https://[::1]/a.png', fetcher)).rejects.toThrow(
			/local network/
		);
		await expect(
			downloadThumbnail('https://x.example/a.png', fetcher, async () => ['::ffff:192.168.1.1'])
		).rejects.toThrow(/local network/);
		await expect(downloadThumbnail('http://cdn.example.com/a.png', fetcher)).rejects.toThrow(
			/https/
		);
		expect(fetcher).not.toHaveBeenCalled();

		const redirect = respond(null, {
			status: 302,
			headers: { location: 'https://169.254.169.254/latest' }
		});
		await expect(
			downloadThumbnail('https://cdn.example.com/a.png', redirect, async (host) =>
				host === '169.254.169.254' ? [host] : ['93.184.215.14']
			)
		).rejects.toThrow(/local network/);
	});

	it('refuses files that are too large or not images', async () => {
		const big = respond(new Uint8Array(1024 * 1024 + 1));
		await expect(
			downloadThumbnail('https://cdn.example.com/a.png', big, publicHost)
		).rejects.toThrow(/1 MB/);
		const svg = respond('<svg xmlns="http://www.w3.org/2000/svg"/>');
		await expect(
			downloadThumbnail('https://cdn.example.com/a.svg', svg, publicHost)
		).rejects.toThrow(/not a PNG/);
	});
});

describe('thumbnail store', () => {
	async function repository() {
		const database = new Database(new sqlite3.Database(':memory:'));
		await database.exec(readFileSync('database/initial.sql', 'utf8'));
		return new GameRepository(database);
	}

	it('downloads once, keeps the image and forgets unused ones', async () => {
		const games = await repository();
		const url = 'https://cdn.example.com/a.png';
		await games.createTemplate({
			slug: 'game',
			name: 'Game',
			description: '',
			image: 'example/game',
			ports: [],
			env: [],
			volumes: [],
			thumbnailUrl: url
		});
		const fetcher = respond(PNG);
		const store = new ThumbnailStore(games, fetcher, publicHost);

		expect((await store.get(url))?.contentType).toBe('image/png');
		expect((await store.get(url))?.data.equals(PNG)).toBe(true);
		expect(fetcher).toHaveBeenCalledTimes(1);

		// Saving another thumbnail removes the ones no game points at.
		await games.saveThumbnail('https://cdn.example.com/old.png', {
			contentType: 'image/png',
			data: PNG
		});
		expect(await games.findThumbnail('https://cdn.example.com/old.png')).toBeUndefined();
		expect(await games.findThumbnail(url)).toBeDefined();
	});

	it('does not ask again right after a failure', async () => {
		const fetcher = respond('nope', { status: 404 });
		const store = new ThumbnailStore(await repository(), fetcher, publicHost);
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(await store.get('https://cdn.example.com/missing.png')).toBeUndefined();
		expect(await store.get('https://cdn.example.com/missing.png')).toBeUndefined();
		expect(fetcher).toHaveBeenCalledTimes(1);
	});
});

describe('placeholder', () => {
	it('shows escaped initials', () => {
		expect(placeholderThumbnail('minecraft-java', 'Minecraft: Java Edition')).toContain('>MJ<');
		expect(placeholderThumbnail('x', '<b> & co')).not.toMatch(/<b>/);
	});
});
