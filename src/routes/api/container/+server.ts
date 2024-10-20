import type { RequestHandler } from '@sveltejs/kit';
import { ContainerStatus } from '$lib/types';
import { fail, json, text } from '@sveltejs/kit';

export const POST: RequestHandler = async ({request, locals}) => {
	const {docker} = locals
	const {id, status} = await request.json()

	let container
	switch (status) {
		case ContainerStatus.START:
			container = docker.container.startContainer(id)
			break;
		case ContainerStatus.STOP:
			container = docker.container.stopContainer(id)
			break;
		case ContainerStatus.RESTART:
			container = docker.container.restartContainer(id)
			break;
		default:
			fail(500, {message: 'NO SUCH CONTAINER STATUS' })
	}


	return json({ id: container.Id })
}

export const fallback: RequestHandler = async ({ request }) => {
	return text(`I caught your ${request.method} request!`);
};