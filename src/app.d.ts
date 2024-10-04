// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces


import type { User, V_User_Role } from '@prisma/client';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			userInformation: {
				user: User,
				roles: V_User_Role[],
				isAdmin: boolean
			}
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
