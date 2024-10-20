

import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async ({locals}) => {
	const {docker} = locals

	return {
		isAdmin: locals.isAdmin,
		network: docker.network.id,
		containers: docker.container.listAllContainers(),
	}
};

