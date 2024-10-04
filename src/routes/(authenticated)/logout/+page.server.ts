import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { cookie_options } from '$lib/utils';

export const actions: Actions = {
	default: async (event) => {
		event.cookies.delete("auth-token",cookie_options);
		event.cookies.delete("email",cookie_options);
		event.cookies.delete("name",cookie_options);
		throw redirect(301, "/");
	}
};