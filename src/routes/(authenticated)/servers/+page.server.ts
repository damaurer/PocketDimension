import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { config } from '#lib/server/config.ts';
import { getServerManager } from '#lib/server/services.ts';
import type { ServerAction } from '#lib/server/games/servers.ts';
import type { GameServerView } from '#lib/games/types.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { games } = locals.repositories;
	const records = await games.listServers(locals.isAdmin ? undefined : locals.user!.id);

	let servers: GameServerView[] = [];
	let dockerError = false;
	try {
		servers = await (await getServerManager()).views(records);
	} catch (e) {
		console.error('Docker:', e);
		dockerError = true;
	}

	return {
		servers,
		dockerError,
		host: config.games.publicHost || url.hostname
	};
};

/** Loads the server named in the form and checks that the user may touch it. */
async function ownedServer({ locals, request }: RequestEvent) {
	const data = await request.formData();
	const id = Number(data.get('id'));
	const server = Number.isInteger(id) ? await locals.repositories.games.findServer(id) : undefined;
	if (!server || (!locals.isAdmin && server.ownerId !== locals.user!.id)) {
		return undefined;
	}
	return server;
}

function serverAction(action: ServerAction) {
	return async (event: RequestEvent) => {
		const server = await ownedServer(event);
		if (!server) return fail(404, { message: 'Server not found.' });
		try {
			await (await getServerManager()).action(server, action);
		} catch (e) {
			console.error(`Server ${action}:`, e);
			return fail(502, { message: `Could not ${action} the server.` });
		}
	};
}

export const actions: Actions = {
	start: serverAction('start'),
	stop: serverAction('stop'),
	restart: serverAction('restart'),

	retry: async (event) => {
		const server = await ownedServer(event);
		if (!server) return fail(404, { message: 'Server not found.' });
		const manager = await getServerManager();
		void manager.provision(server.id);
	},

	delete: async (event) => {
		const server = await ownedServer(event);
		if (!server) return fail(404, { message: 'Server not found.' });
		try {
			await (await getServerManager()).remove(server);
		} catch (e) {
			console.error('Delete server:', e);
			return fail(502, { message: 'Could not delete the server.' });
		}
	}
};
