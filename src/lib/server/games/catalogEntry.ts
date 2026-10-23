import type { GameTemplateInput } from '#lib/games/types.ts';
import { formatPorts, formatVolumes, validateTemplate } from './validation.ts';

/**
 * The shared game catalog (`catalog/` in the repository) is a list of game
 * templates in the same shape as `GameTemplateInput`, each with a version
 * that is raised on every change. Instances fetch `catalog/catalog.json`.
 */
export const CATALOG_SCHEMA_VERSION = 1;

export interface CatalogEntry extends GameTemplateInput {
	version: number;
}

type Result<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

const RESERVED_SLUGS = new Set(['new']);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isArrayOf = (value: unknown, check: (item: Record<string, unknown>) => boolean) =>
	Array.isArray(value) && value.every((item) => isRecord(item) && check(item));

const optional = (value: unknown, type: string) =>
	value === undefined || value === null || typeof value === type;

/** Checks one catalog entry with the same rules as the template editor. */
export function parseCatalogEntry(data: unknown): Result<CatalogEntry> {
	if (!isRecord(data)) return { error: 'Entry must be an object.' };
	const slug = typeof data.slug === 'string' ? data.slug : '?';
	const fail = (message: string) => ({ error: `${slug}: ${message}` });

	if (!Number.isInteger(data.version) || (data.version as number) < 1) {
		return fail('"version" must be a positive whole number.');
	}
	if (
		typeof data.slug !== 'string' ||
		typeof data.name !== 'string' ||
		typeof data.image !== 'string' ||
		!optional(data.description, 'string') ||
		!optional(data.memoryMb, 'number') ||
		!optional(data.docsUrl, 'string') ||
		!optional(data.thumbnailUrl, 'string')
	) {
		return fail('"slug", "name" and "image" must be strings.');
	}
	if (RESERVED_SLUGS.has(data.slug)) return fail('This slug is reserved.');
	if (
		!isArrayOf(
			data.ports ?? [],
			(p) =>
				Number.isInteger(p.container) &&
				typeof p.protocol === 'string' &&
				optional(p.label, 'string')
		)
	) {
		return fail('"ports" must be a list of { container, protocol, label }.');
	}
	if (!isArrayOf(data.volumes ?? [], (v) => typeof v.container === 'string')) {
		return fail('"volumes" must be a list of { container }.');
	}
	if (!Array.isArray(data.env ?? [])) return fail('"env" must be a list.');
	const query = data.query;
	if (
		query !== undefined &&
		query !== null &&
		!(isRecord(query) && typeof query.type === 'string' && Number.isInteger(query.port))
	) {
		return fail('"query" must be { type, port }.');
	}

	const result = validateTemplate({
		slug: data.slug,
		name: data.name,
		description: (data.description as string | undefined) ?? '',
		image: data.image,
		ports: formatPorts((data.ports as GameTemplateInput['ports']) ?? []),
		env: JSON.stringify(data.env ?? []),
		volumes: formatVolumes((data.volumes as GameTemplateInput['volumes']) ?? []),
		memoryMb: data.memoryMb ? String(data.memoryMb) : '',
		queryType: isRecord(query) ? (query.type as string) : '',
		queryPort: isRecord(query) ? String(query.port) : '',
		docsUrl: (data.docsUrl as string | undefined) ?? '',
		thumbnailUrl: (data.thumbnailUrl as string | undefined) ?? ''
	});
	if (result.error !== undefined) return fail(result.error);
	return { value: { version: data.version as number, ...result.value } };
}

/** Parses a whole catalog. Invalid entries are left out and reported. */
export function parseCatalog(data: unknown): { entries: CatalogEntry[]; invalid: string[] } {
	if (!isRecord(data) || !Array.isArray(data.games)) {
		throw new Error('The catalog has no "games" list.');
	}
	if (data.schemaVersion !== CATALOG_SCHEMA_VERSION) {
		throw new Error(
			`The catalog uses format ${String(data.schemaVersion)}; this version of PocketDimension reads format ${CATALOG_SCHEMA_VERSION}. Update PocketDimension.`
		);
	}

	const entries: CatalogEntry[] = [];
	const invalid: string[] = [];
	const slugs = new Set<string>();
	for (const item of data.games) {
		const result = parseCatalogEntry(item);
		if (result.error !== undefined) {
			invalid.push(result.error);
		} else if (slugs.has(result.value.slug)) {
			invalid.push(`${result.value.slug}: listed twice.`);
		} else {
			slugs.add(result.value.slug);
			entries.push(result.value);
		}
	}
	return { entries, invalid };
}

/** A template as catalog entry, e.g. to propose it for the shared catalog. */
export function toCatalogEntry(template: GameTemplateInput, version: number): CatalogEntry {
	return {
		version,
		slug: template.slug,
		name: template.name,
		description: template.description,
		image: template.image,
		ports: template.ports,
		env: template.env,
		volumes: template.volumes,
		memoryMb: template.memoryMb ?? null,
		query: template.query ?? null,
		docsUrl: template.docsUrl ?? null,
		thumbnailUrl: template.thumbnailUrl ?? null
	};
}
