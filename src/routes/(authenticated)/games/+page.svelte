<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { locale, t } from '#lib/i18n/i18n.ts';
	import { gameDescription } from '#lib/i18n/catalog.ts';

	let { data }: { data: PageData } = $props();

	let search = $state('');
	const templates = $derived(
		data.templates.filter((template) =>
			`${template.name} ${gameDescription($locale, template)}`
				.toLowerCase()
				.includes(search.toLowerCase().trim())
		)
	);
	const limitReached = $derived(data.maxServers !== null && data.serverCount >= data.maxServers);

	const formatMemory = (mb: number) => (mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`);
</script>

<svelte:head>
	<title>{$t('games')} · Pocket Dimension</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1><Translate key="games" /></h1>
		<p class="subtitle">
			<Translate key="games.intro" />
			{#if data.maxServers !== null}
				<Translate
					key="games.limit"
					variables={{ count: data.serverCount, max: data.maxServers }}
				/>
			{/if}
		</p>
	</div>
	<div class="actions">
		<input
			type="search"
			class="search"
			placeholder={$t('games.search')}
			aria-label={$t('games.search')}
			bind:value={search}
		/>
		{#if data.isAdmin}
			<a class="btn" href={resolve('/(authenticated)/games/new')}>
				+ <Translate key="games.admin.new" />
			</a>
		{/if}
	</div>
</div>

{#if limitReached}
	<p class="alert info"><Translate key="games.limitReached" /></p>
{/if}

<div class="grid">
	{#each templates as template (template.id)}
		<article class="card game" class:disabled={!template.enabled}>
			<header>
				<h2>{template.name}</h2>
				{#if !template.enabled}
					<span class="badge"><Translate key="games.disabled" /></span>
				{/if}
			</header>
			<p class="description">{gameDescription($locale, template)}</p>
			<ul class="chips">
				{#if template.memoryMb}
					<li title={$t('games.form.memory')}>RAM {formatMemory(template.memoryMb)}</li>
				{/if}
				<li title={$t('games.ports')}>
					{#if template.ports.length}
						{template.ports.map((p) => `${p.container}/${p.protocol}`).join(', ')}
					{:else}
						<Translate key="games.noPorts" />
					{/if}
				</li>
				{#if template.query}
					<li><Translate key="games.liveStatus" /></li>
				{/if}
				{#if template.docsUrl}
					<li>
						<a href={template.docsUrl} target="_blank" rel="noopener noreferrer external">
							<Translate key="games.docs" /> &nearr;
						</a>
					</li>
				{/if}
			</ul>
			<div class="actions">
				{#if template.enabled && !limitReached}
					<a
						class="btn btn-primary"
						href={resolve('/(authenticated)/games/[slug]', { slug: template.slug })}
					>
						<Translate key="games.create" />
					</a>
				{/if}
			</div>
			{#if data.isAdmin}
				<div class="admin actions">
					<a
						class="btn btn-ghost btn-small"
						href={resolve('/(authenticated)/games/[slug]/edit', { slug: template.slug })}
					>
						<Translate key="games.admin.edit" />
					</a>
					<form method="POST" action="?/toggle" use:enhance>
						<input type="hidden" name="id" value={template.id} />
						<button class="btn-ghost btn-small">
							<Translate key={template.enabled ? 'games.admin.disable' : 'games.admin.enable'} />
						</button>
					</form>
				</div>
			{/if}
		</article>
	{:else}
		<p class="muted"><Translate key="games.noResults" /></p>
	{/each}
</div>

<style>
	.search {
		width: 16rem;
		max-width: 100%;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: 1rem;
	}

	.game {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.game.disabled {
		opacity: 0.65;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}

	h2 {
		margin: 0;
	}

	.description {
		flex: 1;
		margin: 0;
		color: var(--text-muted);
		font-size: 0.95rem;
		overflow-wrap: anywhere;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chips li {
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	.admin {
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
	}
</style>
