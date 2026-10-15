import { error, json, type RequestHandler } from '@sveltejs/kit';
import { ContainerStatus } from '#lib/types.ts';
import { getContainerClient } from '#lib/server/services.ts';
import { ContainerNotFoundError, isContainerId } from '#lib/server/docker/api/container.client.ts';

const STATUSES = Object.values(ContainerStatus);

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.isAdmin) {
		error(403, 'Only administrators can manage containers.');
	}

	// Cookies are SameSite=Lax, but make cross-site requests fail explicitly as well.
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) {
		error(403, 'Cross-site request blocked.');
	}

	const body = await request.json().catch(() => undefined);
	const { id, status } = (body ?? {}) as { id?: unknown; status?: unknown };

	if (!isContainerId(id) || !STATUSES.includes(status as ContainerStatus)) {
		error(400, 'Invalid container id or status.');
	}

	try {
		const client = await getContainerClient();
		await client.changeStatus(id, status as ContainerStatus);
	} catch (e) {
		if (e instanceof ContainerNotFoundError) {
			error(404, e.message);
		}
		console.error('Docker:', e);
		error(502, 'Docker request failed.');
	}

	return json({ id, status });
};
