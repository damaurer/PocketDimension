// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces



import type { Role, User } from '$lib/types';
import type { VUserRoleRepository } from '$lib/server/database/repository/vUserRole.repository';
import type { UserRepository } from '$lib/server/database/repository/user.repository';
import type { ContainerClient } from '$lib/server/docker/api/container.client';
import type { Network } from 'dockerode';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User,
			isAdmin: boolean,
			repositories: {
				vUserRole: VUserRoleRepository,
				user: UserRepository
			},
			docker: {
				network: Network,
				container: ContainerClient
			}
		}
		interface PageData {
			user: {
				isAdmin: boolean,
				roles: Role[]
			}
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
