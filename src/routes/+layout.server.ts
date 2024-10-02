
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {


	const name = event.cookies.get("name") ?? "";
	const email = event.cookies.get("email") ?? "";

	return { name, email };
};