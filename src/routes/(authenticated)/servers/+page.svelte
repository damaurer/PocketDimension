<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { t } from '#lib/i18n/i18n.ts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const busy = $derived(
		data.servers.some((s) => ['pending', 'pulling', 'creating'].includes(s.status))
	);

	// Refresh while servers are being created, otherwise now and then for state changes.
	$effect(() => {
		const timer = setInterval(() => invalidateAll(), busy ? 3000 : 15000);
		return () => clearInterval(timer);
	});

	function statusKey(server: PageData['servers'][number]) {
		if (server.status !== 'ready') return `servers.status.${server.status}`;
		return `servers.state.${server.state ?? 'exited'}`;
	}
</script>

<svelte:head>
	<title>Servers</title>
</svelte:head>

<h1><Translate key="servers.title" /></h1>

{#if data.isAdmin}
	<p class="empty"><a href={resolve('/(authenticated)/container')}>Docker containers</a></p>
{/if}

{#if data.dockerError}
	<p class="error">Docker is not reachable.</p>
{/if}

{#if form?.message}
	<p class="error">{form.message}</p>
{/if}

{#if data.servers.length === 0}
	<p class="empty">
		<a href={resolve('/(authenticated)/games')}><Translate key="servers.empty" /></a>
	</p>
{/if}

<div class="list">
	{#each data.servers as server (server.id)}
		<article class="server">
			<header>
				<h2>{server.name}</h2>
				<span class="status status-{server.status === 'ready' ? server.state : server.status}">
					<Translate key={statusKey(server)} />
				</span>
			</header>
			<p class="meta">
				{server.template.name}
				{#if data.isAdmin}
					&middot; <Translate key="servers.owner" />: {server.ownerName ?? server.ownerId}
				{/if}
			</p>
			{#if server.statusMessage}
				<p class="error">{server.statusMessage}</p>
			{/if}
			{#if server.ports.length}
				<p class="connect">
					<Translate key="servers.connect" />:
					{#each server.ports as port, i (i)}
						<code>{data.host}:{port.host}</code>
						<small>{port.protocol}{port.label ? ` · ${port.label}` : ''}</small>&nbsp;
					{/each}
				</p>
			{/if}
			<div class="actions">
				{#if server.status === 'ready'}
					{#if server.state === 'running' || server.state === 'restarting'}
						<form method="POST" action="?/stop" use:enhance>
							<input type="hidden" name="id" value={server.id} />
							<button><Translate key="servers.stop" /></button>
						</form>
						<form method="POST" action="?/restart" use:enhance>
							<input type="hidden" name="id" value={server.id} />
							<button><Translate key="servers.restart" /></button>
						</form>
					{:else}
						<form method="POST" action="?/start" use:enhance>
							<input type="hidden" name="id" value={server.id} />
							<button><Translate key="servers.start" /></button>
						</form>
					{/if}
				{:else if server.status === 'error'}
					<form method="POST" action="?/retry" use:enhance>
						<input type="hidden" name="id" value={server.id} />
						<button><Translate key="servers.retry" /></button>
					</form>
				{/if}
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm($t('servers.deleteConfirm'))) cancel();
					}}
				>
					<input type="hidden" name="id" value={server.id} />
					<button class="danger"><Translate key="servers.delete" /></button>
				</form>
			</div>
		</article>
	{/each}
</div>

<style>
	.empty {
		text-align: center;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.server {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid var(--color-theme-1);
		border-radius: 0.5rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	.meta {
		margin: 0.25rem 0;
		opacity: 0.8;
	}

	.status {
		font-size: 0.8rem;
		padding: 0.15rem 0.5rem;
		border-radius: 1rem;
		background: var(--color-bg-0);
	}

	.status-running {
		background: #b8e6c1;
	}

	.status-error,
	.status-dead {
		background: #f3b9b9;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.danger {
		color: #a11;
	}
</style>
