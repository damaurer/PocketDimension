import { parseCatalogEntry, type CatalogEntry } from './catalogEntry.ts';

/**
 * Games that ship with PocketDimension: the shared catalog in `catalog/games`
 * as it was when the app was built. They are inserted on start, so the app
 * works without internet access; newer versions come from the online catalog.
 */
const files = import.meta.glob<unknown>('/catalog/games/*.json', {
	eager: true,
	import: 'default'
});

export const BUILTIN_TEMPLATES: CatalogEntry[] = Object.entries(files)
	.map(([path, data]) => {
		const result = parseCatalogEntry(data);
		if (result.error !== undefined) throw new Error(`${path}: ${result.error}`);
		return result.value;
	})
	.sort((a, b) => a.slug.localeCompare(b.slug));
