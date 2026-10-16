<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Games</title>
	<meta name="description" content="Games" />
</svelte:head>

<h1><Translate key="games" /></h1>
<p class="intro">
	<Translate key="games.intro" />
	{#if data.maxServers !== null}
		<Translate key="games.limit" variables={{ count: data.serverCount, max: data.maxServers }} />
	{/if}
</p>

{#if data.isAdmin}
	<p class="admin-bar">
		<a href={resolve('/(authenticated)/games/new')}><Translate key="games.admin.new" /></a>
	</p>
{/if}

<div class="grid">
	{#each data.templates as template (template.id)}
		<article class="card" class:disabled={!template.enabled}>
			<h2>{template.name}</h2>
			{#if !template.enabled}
				<span class="badge"><Translate key="games.disabled" /></span>
			{/if}
			<p>{template.description}</p>
			<p class="ports">
				<Translate key="games.ports" />:
				{#if template.ports.length}
					{template.ports.map((p) => `${p.container}/${p.protocol}`).join(', ')}
				{:else}
					<Translate key="games.noPorts" />
				{/if}
			</p>
			<div class="actions">
				{#if template.enabled}
					<a
						class="button"
						href={resolve('/(authenticated)/games/[slug]', { slug: template.slug })}
					>
						<Translate key="games.create" />
					</a>
				{/if}
				{#if template.docsUrl}
					<a href={template.docsUrl} target="_blank" rel="noopener noreferrer external">
						<Translate key="games.docs" />
					</a>
				{/if}
				{#if data.isAdmin}
					<a href={resolve('/(authenticated)/games/[slug]/edit', { slug: template.slug })}>
						<Translate key="games.admin.edit" />
					</a>
					<form method="POST" action="?/toggle" use:enhance>
						<input type="hidden" name="id" value={template.id} />
						<button class="link">
							<Translate key={template.enabled ? 'games.admin.disable' : 'games.admin.enable'} />
						</button>
					</form>
				{/if}
			</div>
		</article>
	{/each}
</div>

<style>
	.intro,
	.admin-bar {
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid var(--color-theme-1);
		border-radius: 0.5rem;
	}

	.card.disabled {
		opacity: 0.6;
	}

	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
	}

	.card p {
		flex: 1;
		overflow-wrap: anywhere;
		margin: 0 0 0.5rem;
	}

	.card .ports {
		flex: 0;
		font-size: 0.85rem;
	}

	.badge {
		align-self: flex-start;
		font-size: 0.75rem;
		padding: 0.1rem 0.4rem;
		border-radius: 0.25rem;
		background: var(--color-bg-0);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
	}

	.button {
		padding: 0.3rem 0.8rem;
		border-radius: 0.25rem;
		background: var(--color-theme-2);
		color: white;
	}

	.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-theme-1);
		cursor: pointer;
		font: inherit;
	}
</style>
