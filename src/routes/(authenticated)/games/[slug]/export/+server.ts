import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { toCatalogEntry } from '#lib/server/games/catalogEntry.ts';

/** Downloads a game as entry for the shared catalog (catalog/games/<slug>.json). */
export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.isAdmin) error(403, 'Only administrators can export games.');
	const template = await locals.repositories.games.findTemplateBySlug(params.slug);
	if (!template) error(404, 'Game not found.');

	const entry = toCatalogEntry(template, (template.catalogVersion ?? 0) + 1);
	return json(entry, {
		headers: { 'content-disposition': `attachment; filename="${template.slug}.json"` }
	});
};
