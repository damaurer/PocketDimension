// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces



import type { Role, User } from '$lib/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User,
			isAdmin: boolean,
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
