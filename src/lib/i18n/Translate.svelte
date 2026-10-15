<script lang="ts">
	import { t } from '#lib/i18n/i18n.ts';

	let { key, variables = {} }: { key: string; variables?: Record<string, unknown> } = $props();
</script>

<!-- Translations are trusted strings; variables are escaped in translate(). -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html $t(key, variables)}
