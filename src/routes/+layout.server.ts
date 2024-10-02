import { redirect } from '@sveltejs/kit';
import { get } from "svelte/store";
import {locale} from '$lib/i18n/i18n'
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const language = get(locale)
	if (!locals.user) {
		// redirect(307, `/${language}/login`);
	}
};