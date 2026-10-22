/**
 * Checks and bundles the shared game catalog.
 *
 *   node scripts/catalog.ts check   validate catalog/games/*.json and catalog/catalog.json
 *   node scripts/catalog.ts build   write catalog/catalog.json from catalog/games/*.json
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import {
	CATALOG_SCHEMA_VERSION,
	parseCatalog,
	parseCatalogEntry,
	type CatalogEntry
} from '../src/lib/server/games/catalogEntry.ts';

const GAMES_DIR = 'catalog/games';
const BUNDLE = 'catalog/catalog.json';

function readGames(): { entries: CatalogEntry[]; errors: string[] } {
	const entries: CatalogEntry[] = [];
	const errors: string[] = [];
	for (const file of readdirSync(GAMES_DIR).sort()) {
		if (!file.endsWith('.json')) continue;
		let data: unknown;
		try {
			data = JSON.parse(readFileSync(`${GAMES_DIR}/${file}`, 'utf8'));
		} catch (e) {
			errors.push(`${file}: not valid JSON (${(e as Error).message})`);
			continue;
		}
		const result = parseCatalogEntry(data);
		if (result.error !== undefined) {
			errors.push(`${file}: ${result.error}`);
		} else if (file !== `${result.value.slug}.json`) {
			errors.push(`${file}: the file must be named ${result.value.slug}.json`);
		} else {
			entries.push(result.value);
		}
	}
	return { entries, errors };
}

const bundle = (entries: CatalogEntry[]) => ({
	schemaVersion: CATALOG_SCHEMA_VERSION,
	games: entries
});

const command = process.argv[2];
const { entries, errors } = readGames();

if (command === 'build' && errors.length === 0) {
	writeFileSync(BUNDLE, JSON.stringify(bundle(entries), null, '\t') + '\n');
	console.log(`Wrote ${BUNDLE} with ${entries.length} games.`);
} else if (command === 'check' && errors.length === 0) {
	let published: unknown;
	try {
		published = JSON.parse(readFileSync(BUNDLE, 'utf8'));
	} catch {
		published = undefined;
	}
	const parsed = published === undefined ? undefined : parseCatalog(published);
	if (!parsed || parsed.invalid.length > 0 || !isDeepStrictEqual(parsed.entries, entries)) {
		errors.push(`${BUNDLE} is out of date. Run: npm run catalog:build`);
	} else {
		console.log(`Catalog OK: ${entries.length} games.`);
	}
} else if (command !== 'build' && command !== 'check') {
	errors.push('Usage: node scripts/catalog.ts check|build');
}

if (errors.length > 0) {
	for (const error of errors) console.error(error);
	process.exit(1);
}
