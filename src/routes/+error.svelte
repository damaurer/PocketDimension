<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Translate from '#lib/i18n/Translate.svelte';
	import { msg } from '#lib/i18n/i18n.ts';
</script>

<svelte:head>
	<title>{page.status} · Pocket Dimension</title>
</svelte:head>

<div class="wrap">
	<div class="card">
		<p class="status">{page.status}</p>
		<h1><Translate key={page.status === 404 ? 'error.notFound' : 'error.generic'} /></h1>
		{#if page.error?.message && page.status !== 404}
			<p class="muted">{$msg(page.error.message)}</p>
		{/if}
		<a class="btn btn-primary" href={resolve('/(public)')}><Translate key="error.home" /></a>
	</div>
</div>

<style>
	.wrap {
		display: flex;
		justify-content: center;
		padding: 4rem 1rem;
	}

	.card {
		max-width: 28rem;
		text-align: center;
	}

	.status {
		margin: 0;
		font-size: 3rem;
		font-weight: 800;
		color: var(--accent);
	}
</style>
