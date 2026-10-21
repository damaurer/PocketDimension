<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { t } from '#lib/i18n/i18n.ts';
	import TemplateForm from '../../TemplateForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{data.values.name} · Pocket Dimension</title>
</svelte:head>

<div class="narrow wide">
	<a class="back-link" href={resolve('/(authenticated)/games')}>
		&larr; <Translate key="games.back" />
	</a>
	<div class="page-header">
		<h1>{data.values.name}</h1>
	</div>

	{#if data.builtin}
		<p class="alert info"><Translate key="games.admin.builtin" /></p>
	{/if}

	<TemplateForm
		values={form && 'values' in form && form.values ? form.values : data.values}
		message={form?.message}
	/>

	{#if !data.builtin && !data.inUse}
		<form
			method="POST"
			action="?/delete"
			class="delete"
			use:enhance={({ cancel }) => {
				if (!confirm($t('games.admin.deleteConfirm'))) cancel();
			}}
		>
			<button class="btn-danger"><Translate key="games.admin.delete" /></button>
		</form>
	{/if}
</div>

<style>
	.wide {
		max-width: 48rem;
	}

	.delete {
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
</style>
