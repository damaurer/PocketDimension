<script lang="ts">
	import '../app.css';
	import { locale } from '#lib/i18n/i18n.ts';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Set before the page renders, so server-rendered HTML is already in the right language.
	// svelte-ignore state_referenced_locally
	locale.set(data.locale);
</script>

{@render children()}
