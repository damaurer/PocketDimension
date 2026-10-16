import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { readTemplateForm, templateToForm } from '#lib/server/games/templateForm.ts';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.isAdmin) error(403, 'Only administrators can edit games.');
	const template = await locals.repositories.games.findTemplateBySlug(params.slug);
	if (!template) error(404, 'Game not found.');

	return {
		id: template.id,
		builtin: template.builtin,
		inUse: (await locals.repositories.games.countServersUsingTemplate(template.id)) > 0,
		values: templateToForm(template)
	};
};

export const actions: Actions = {
	save: async ({ locals, params, request }) => {
		if (!locals.isAdmin) error(403, 'Only administrators can edit games.');
		const games = locals.repositories.games;
		const template = await games.findTemplateBySlug(params.slug);
		if (!template) error(404, 'Game not found.');

		const { values, value, error: message } = readTemplateForm(await request.formData());
		if (!value) return fail(400, { values, message });

		const other = await games.findTemplateBySlug(value.slug);
		if (other && other.id !== template.id) {
			return fail(400, { values, message: 'A game with this slug already exists.' });
		}
		await games.updateTemplate(template.id, value);
		redirect(303, '/games');
	},

	delete: async ({ locals, params }) => {
		if (!locals.isAdmin) error(403, 'Only administrators can delete games.');
		const games = locals.repositories.games;
		const template = await games.findTemplateBySlug(params.slug);
		if (!template) error(404, 'Game not found.');
		if (template.builtin) {
			return fail(400, { message: 'Built-in games cannot be deleted; disable them instead.' });
		}
		if ((await games.countServersUsingTemplate(template.id)) > 0) {
			return fail(400, { message: 'Delete the servers of this game first.' });
		}
		await games.deleteTemplate(template.id);
		redirect(303, '/games');
	}
};
