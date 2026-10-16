// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '#lib/types.ts';
import type { Repositories } from '#lib/server/services.ts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | undefined;
			isAdmin: boolean;
			repositories: Repositories;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
