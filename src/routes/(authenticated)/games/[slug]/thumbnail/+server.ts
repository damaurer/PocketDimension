import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getThumbnailStore } from '#lib/server/services.ts';
import { placeholderThumbnail } from '#lib/server/games/thumbnails.ts';

/**
 * The game's thumbnail, served by the app itself. Pages link it with the
 * address hash as `?v=`, so a changed address is a new URL and caching is safe.
 */
export const GET: RequestHandler = async ({ locals, params }) => {
	const template = await locals.repositories.games.findTemplateBySlug(params.slug);
	if (!template || (!template.enabled && !locals.isAdmin)) error(404, 'Game not found.');

	const headers = { 'Content-Security-Policy': "default-src 'none'" };
	const thumbnail =
		template.thumbnailUrl && (await (await getThumbnailStore()).get(template.thumbnailUrl));
	if (thumbnail) {
		return new Response(new Uint8Array(thumbnail.data), {
			headers: {
				...headers,
				'Content-Type': thumbnail.contentType,
				'Cache-Control': 'private, max-age=604800, immutable'
			}
		});
	}
	return new Response(placeholderThumbnail(template.slug, template.name), {
		headers: {
			...headers,
			'Content-Type': 'image/svg+xml',
			// Short, so a thumbnail that could not be loaded yet shows up soon after.
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
