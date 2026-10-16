<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import TemplateForm from '../TemplateForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>New game</title>
</svelte:head>

<h1><Translate key="games.admin.new" /></h1>

<TemplateForm values={form?.values ?? data.values} message={form?.message} />
