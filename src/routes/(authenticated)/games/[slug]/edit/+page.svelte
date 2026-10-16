<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import TemplateForm from '../../TemplateForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{data.values.name}</title>
</svelte:head>

<h1>{data.values.name}</h1>

{#if data.builtin}
	<p class="note"><Translate key="games.admin.builtin" /></p>
{/if}

<TemplateForm
	values={form && 'values' in form && form.values ? form.values : data.values}
	message={form?.message}
/>

{#if !data.builtin && !data.inUse}
	<form method="POST" action="?/delete" use:enhance class="delete">
		<button><Translate key="games.admin.delete" /></button>
	</form>
{/if}

<style>
	.note {
		text-align: center;
	}

	.delete {
		margin-top: 2rem;
		text-align: center;
	}
</style>
