import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getContainerClient } from '#lib/server/services.ts';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.isAdmin) {
		error(403, 'Only administrators can manage containers.');
	}

	const containers = getContainerClient()
		.then((client) => client.listManagedContainers())
		.then((list) =>
			list.map(({ Id, Names, State, Status, Ports }) => ({
				Id,
				Names,
				State,
				Status,
				Ports: Ports.map((p) => ({ PrivatePort: p.PrivatePort, PublicPort: p.PublicPort, Type: p.Type }))
			}))
		)
		.catch((e) => {
			console.error('Docker:', e);
			throw new Error('Docker is not reachable.');
		});

	return { containers };
};
