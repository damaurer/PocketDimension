<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { t } from '#lib/i18n/i18n.ts';
	import TemplateForm from '../TemplateForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{$t('games.admin.new')} · Pocket Dimension</title>
</svelte:head>

<div class="narrow wide">
	<a class="back-link" href={resolve('/(authenticated)/games')}>
		&larr; <Translate key="games.back" />
	</a>
	<div class="page-header">
		<div>
			<h1><Translate key="games.admin.new" /></h1>
			<p class="subtitle"><Translate key="template.intro" /></p>
		</div>
	</div>

	<TemplateForm values={form?.values ?? data.values} message={form?.message} />
</div>

<style>
	.wide {
		max-width: 48rem;
	}
</style>
