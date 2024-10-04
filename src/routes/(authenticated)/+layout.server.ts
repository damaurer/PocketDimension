
import type { LayoutServerLoad } from "./$types";
export const load: LayoutServerLoad = async ({ cookies }) => {



	const name = cookies.get("name") ?? "";
	const email = cookies.get("email") ?? "";

	return { name, email };
};