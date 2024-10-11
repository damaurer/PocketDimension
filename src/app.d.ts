// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces



import type { Role, User } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			userInformation: {
				user: User,
				roles: Role[],
				isAdmin: boolean
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
