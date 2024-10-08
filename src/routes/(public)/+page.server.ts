import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from "./$types";
import { loginUser } from '$lib/server/services/user-service';
import { cookie_options } from "$lib/utils";

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();

		const email = (data.get("email") as string)
			?.toLowerCase()
			?.trim();
		const password = data.get("password") as string;

		if(!email){
			return {error: "No Valid email"}
		}

		const userData = await loginUser(email, password);

		if ("status" in userData && "data" in userData) {
			return userData;
		} else {
			const { token, user } = userData;

			event.cookies.set("auth-token", token, cookie_options);
			event.cookies.set("email", user.email, cookie_options);
			event.cookies.set("name", user.name, cookie_options);

			redirect(302, "/container")
		}
	}
};