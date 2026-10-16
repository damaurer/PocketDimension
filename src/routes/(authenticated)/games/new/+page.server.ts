import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { EMPTY_TEMPLATE_FORM, readTemplateForm } from '#lib/server/games/templateForm.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.isAdmin) error(403, 'Only administrators can add games.');
	return { values: EMPTY_TEMPLATE_FORM };
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		if (!locals.isAdmin) error(403, 'Only administrators can add games.');
		const { values, value, error: message } = readTemplateForm(await request.formData());
		if (!value) return fail(400, { values, message });

		if (await locals.repositories.games.findTemplateBySlug(value.slug)) {
			return fail(400, { values, message: 'A game with this slug already exists.' });
		}
		await locals.repositories.games.createTemplate(value);
		redirect(303, '/games');
	}
};
