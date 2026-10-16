import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { config } from '#lib/server/config.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const { games } = locals.repositories;
	return {
		templates: await games.listTemplates(locals.isAdmin),
		serverCount: await games.countServers(locals.user!.id),
		maxServers: locals.isAdmin ? null : config.games.maxServersPerUser
	};
};

export const actions: Actions = {
	toggle: async ({ locals, request }) => {
		if (!locals.isAdmin) error(403, 'Only administrators can change templates.');
		const data = await request.formData();
		const id = Number(data.get('id'));
		const template = await locals.repositories.games.findTemplateById(id);
		if (!template) return fail(404, { message: 'Template not found.' });
		await locals.repositories.games.setTemplateEnabled(id, !template.enabled);
	}
};
