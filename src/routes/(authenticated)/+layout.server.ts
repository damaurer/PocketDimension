
import type { LayoutServerLoad } from "../../../.svelte-kit/types/src/routes";
export const load: LayoutServerLoad = async ({ cookies }) => {



	const name = cookies.get("name") ?? "";
	const email = cookies.get("email") ?? "";

	return { name, email };
};