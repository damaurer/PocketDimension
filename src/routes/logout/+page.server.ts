import { redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
	default: async (event) => {
		event.cookies.delete("auth-token",{path: ''});
		event.cookies.delete("email",{path: ''});
		event.cookies.delete("name",{path: ''});
		throw redirect(301, "/");
	}
};