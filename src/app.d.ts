// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { User } from '#lib/types.ts';
import type { UserRepository } from '#lib/server/database/repository/user.repository.ts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | undefined;
			isAdmin: boolean;
			repositories: {
				user: UserRepository;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
