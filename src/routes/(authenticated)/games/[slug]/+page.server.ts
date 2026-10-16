import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { config } from '#lib/server/config.ts';
import { formString } from '#lib/server/security/validation.ts';
import { validateServerEnv } from '#lib/server/games/validation.ts';
import { getServerManager } from '#lib/server/services.ts';
import { NoFreePortsError, ServerLimitError } from '#lib/server/games/servers.ts';

const NAME = /^[\p{L}\p{N} ._'-]{2,40}$/u;

export const load: PageServerLoad = async ({ locals, params }) => {
	const template = await locals.repositories.games.findTemplateBySlug(params.slug);
	if (!template || !template.enabled) error(404, 'Game not found.');

	return {
		template: { ...template, image: undefined },
		serverCount: await locals.repositories.games.countServers(locals.user!.id),
		maxServers: locals.isAdmin ? null : config.games.maxServersPerUser
	};
};

export const actions: Actions = {
	default: async ({ locals, params, request }) => {
		const template = await locals.repositories.games.findTemplateBySlug(params.slug);
		if (!template || !template.enabled) error(404, 'Game not found.');

		const data = await request.formData();
		const name = formString(data, 'name');
		if (!NAME.test(name)) {
			return fail(400, { message: 'Server name must have 2 to 40 letters, digits or spaces.' });
		}

		const values: Record<string, string> = {};
		for (const definition of template.env) {
			const value = data.get(`env.${definition.key}`);
			if (typeof value === 'string') values[definition.key] = value;
		}
		const env = validateServerEnv(template.env, values);
		if (env.error !== undefined) return fail(400, { message: env.error });

		try {
			const manager = await getServerManager();
			await manager.create(
				{ id: locals.user!.id, isAdmin: locals.isAdmin },
				template,
				name,
				env.value
			);
		} catch (e) {
			if (e instanceof ServerLimitError || e instanceof NoFreePortsError) {
				return fail(400, { message: e.message });
			}
			console.error('Create server:', e);
			return fail(502, { message: 'Docker is not reachable. Please try again later.' });
		}

		redirect(303, '/servers');
	}
};
