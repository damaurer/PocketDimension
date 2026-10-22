import { readFileSync } from 'node:fs';
import sqlite3 from 'sqlite3';
import { describe, expect, it } from 'vitest';
import { Database } from '#lib/server/database/client.ts';
import { GameRepository } from '#lib/server/database/repository/game.repository.ts';
import { parseCatalog, parseCatalogEntry, toCatalogEntry, type CatalogEntry } from './catalogEntry';
import { CatalogSync, fetchCatalog } from './catalogSync';
import { BUILTIN_TEMPLATES } from './catalog';

const entry: CatalogEntry = {
	version: 1,
	slug: 'test-game',
	name: 'Test game',
	description: 'A game',
	image: 'example/test:1.0',
	ports: [{ container: 7777, protocol: 'udp', label: 'Game' }],
	env: [{ key: 'SERVER_NAME', label: 'Server name', default: 'Test' }],
	volumes: [{ container: '/data' }],
	memoryMb: 1024,
	query: null,
	docsUrl: 'https://example.com/'
};

async function repository() {
	const database = new Database(new sqlite3.Database(':memory:'));
	await database.exec(readFileSync('database/initial.sql', 'utf8'));
	return new GameRepository(database);
}

const respond = (body: unknown, status = 200) =>
	(async () =>
		new Response(typeof body === 'string' ? body : JSON.stringify(body), {
			status
		})) as unknown as typeof fetch;

describe('catalog entries', () => {
	it('accepts a valid entry and survives an export round trip', () => {
		expect(parseCatalogEntry(entry)).toEqual({ value: entry });
		expect(parseCatalogEntry(toCatalogEntry(entry, 2)).value?.version).toBe(2);
	});

	it('rejects entries the template editor would reject', () => {
		expect(parseCatalogEntry({ ...entry, version: 0 }).error).toBeDefined();
		expect(parseCatalogEntry({ ...entry, image: 'Not An Image' }).error).toBeDefined();
		expect(parseCatalogEntry({ ...entry, slug: 'new' }).error).toBeDefined();
		expect(parseCatalogEntry({ ...entry, volumes: [{ container: '/' }] }).error).toBeDefined();
		expect(parseCatalogEntry({ ...entry, ports: 'nope' }).error).toBeDefined();
		expect(parseCatalogEntry({ ...entry, query: { type: 'nosuchgame', port: 0 } }).error).toMatch(
			/^test-game: /
		);
	});

	it('leaves out invalid and duplicate entries of a catalog', () => {
		const { entries, invalid } = parseCatalog({
			schemaVersion: 1,
			games: [entry, entry, { ...entry, slug: 'bad', image: '' }]
		});
		expect(entries).toEqual([entry]);
		expect(invalid).toHaveLength(2);
	});

	it('refuses an unknown catalog format', () => {
		expect(() => parseCatalog({ schemaVersion: 2, games: [] })).toThrow(/format 2/);
		expect(() => parseCatalog([])).toThrow();
	});

	it('bundles the shipped games in catalog/catalog.json', () => {
		const bundle = parseCatalog(JSON.parse(readFileSync('catalog/catalog.json', 'utf8')));
		expect(bundle.invalid).toEqual([]);
		expect(bundle.entries).toEqual(BUILTIN_TEMPLATES);
	});
});

describe('fetchCatalog', () => {
	it('reports HTTP errors and broken JSON', async () => {
		await expect(fetchCatalog('https://x', respond('', 404))).rejects.toThrow(/HTTP 404/);
		await expect(fetchCatalog('https://x', respond('{'))).rejects.toThrow(/not valid JSON/);
	});
});

describe('syncCatalog', () => {
	it('adds catalog games, updates newer versions and keeps own templates', async () => {
		const games = await repository();
		await games.createTemplate({ ...entry, slug: 'own-game' });
		await games.syncCatalog([entry], { enableNew: true });

		const sync = new CatalogSync(
			games,
			'https://catalog.example/catalog.json',
			respond({
				schemaVersion: 1,
				games: [
					{ ...entry, version: 2, name: 'Renamed' },
					{ ...entry, slug: 'own-game' },
					{ ...entry, slug: 'community-game' }
				]
			})
		);
		const result = await sync.run();

		expect(result).toMatchObject({
			added: ['community-game'],
			updated: ['test-game'],
			skipped: ['own-game'],
			invalid: []
		});
		const updated = await games.findTemplateBySlug('test-game');
		expect(updated).toMatchObject({ name: 'Renamed', catalogVersion: 2, enabled: true });
		const added = await games.findTemplateBySlug('community-game');
		expect(added).toMatchObject({ builtin: true, enabled: false, catalogVersion: 1 });
		expect((await games.findTemplateBySlug('own-game'))?.builtin).toBe(false);
	});

	it('does not go back to an older version', async () => {
		const games = await repository();
		await games.syncCatalog([{ ...entry, version: 3, name: 'New' }], { enableNew: true });
		await games.syncCatalog([{ ...entry, version: 2, name: 'Old' }], { enableNew: true });
		expect((await games.findTemplateBySlug('test-game'))?.name).toBe('New');
	});

	it('keeps the games when the catalog cannot be reached', async () => {
		const games = await repository();
		await games.syncCatalog(BUILTIN_TEMPLATES, { enableNew: true });
		const offline = (async () => {
			throw new Error('getaddrinfo ENOTFOUND');
		}) as unknown as typeof fetch;
		const result = await new CatalogSync(games, 'https://x', offline).run();
		expect(result.error).toMatch(/ENOTFOUND/);
		expect(await games.listTemplates(false)).toHaveLength(BUILTIN_TEMPLATES.length);
	});
});
