<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import CopyText from '#lib/components/CopyText.svelte';
	import { msg, t } from '#lib/i18n/i18n.ts';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Server = PageData['servers'][number];

	const BUSY = ['pending', 'pulling', 'creating'];
	const busy = $derived(data.servers.some((s) => BUSY.includes(s.status)));

	// Refresh while servers are being created, otherwise now and then for state and players.
	$effect(() => {
		const timer = setInterval(() => invalidateAll(), busy ? 3000 : 15000);
		return () => clearInterval(timer);
	});

	function formatBytes(bytes: number) {
		return bytes >= 1024 ** 3
			? `${(bytes / 1024 ** 3).toFixed(1)} GB`
			: `${Math.round(bytes / 1024 ** 2)} MB`;
	}

	function formatUptime(startedAt: string) {
		const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 60000));
		const days = Math.floor(minutes / 1440);
		const hours = Math.floor((minutes % 1440) / 60);
		if (days) return `${days} d ${hours} h`;
		if (hours) return `${hours} h ${minutes % 60} min`;
		return `${minutes} min`;
	}

	function statusKey(server: Server) {
		if (server.status !== 'ready') return `servers.status.${server.status}`;
		return `servers.state.${server.state ?? 'exited'}`;
	}

	function statusTone(server: Server) {
		if (server.status === 'error') return 'badge-danger';
		if (server.status !== 'ready') return 'badge-warning';
		if (server.state === 'running') return 'badge-success';
		if (server.state === 'restarting') return 'badge-warning';
		if (server.state === 'dead') return 'badge-danger';
		return '';
	}

	const isRunning = (server: Server) =>
		server.status === 'ready' && (server.state === 'running' || server.state === 'restarting');
</script>

<svelte:head>
	<title>{$t('servers.title')} · Pocket Dimension</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1><Translate key="servers.title" /></h1>
		{#if data.maxServers !== null}
			<p class="subtitle">
				<Translate
					key="games.limit"
					variables={{ count: data.servers.length, max: data.maxServers }}
				/>
			</p>
		{/if}
	</div>
	<a class="btn btn-primary" href={resolve('/(authenticated)/games')}>
		+ <Translate key="servers.new" />
	</a>
</div>

{#if data.dockerError}
	<p class="alert error"><Translate key="servers.dockerError" /></p>
{/if}

{#if form?.message}
	<p class="alert error" role="alert">{$msg(form.message)}</p>
{/if}

{#if data.servers.length === 0 && !data.dockerError}
	<div class="card empty-state">
		<h2><Translate key="servers.empty.title" /></h2>
		<p><Translate key="servers.empty" /></p>
		<a class="btn btn-primary" href={resolve('/(authenticated)/games')}>
			<Translate key="servers.empty.action" />
		</a>
	</div>
{/if}

<div class="list">
	{#each data.servers as server (server.id)}
		{@const live = isRunning(server) ? data.live[server.id] : undefined}
		<article class="card server">
			<header>
				<div>
					<h2>{server.name}</h2>
					<p class="muted meta">
						{server.template.name}
						{#if data.isAdmin}
							&middot; <Translate key="servers.owner" />: {server.ownerName ?? server.ownerId}
						{/if}
					</p>
				</div>
				<span class="badge {statusTone(server)}"><Translate key={statusKey(server)} /></span>
			</header>

			{#if BUSY.includes(server.status)}
				<p class="hint"><Translate key="servers.creatingHint" /></p>
			{/if}

			{#if server.statusMessage}
				<p class="alert error">{$msg(server.statusMessage)}</p>
			{/if}

			{#if live}
				{#if live.queryState === 'unreachable'}
					<p class="hint"><Translate key="servers.live.unreachable" /></p>
				{/if}
				<dl class="stats">
					{#if live.query}
						<div class="stat highlight">
							<dt><Translate key="servers.live.players" /></dt>
							<dd>
								{live.query.players}{live.query.maxPlayers ? ` / ${live.query.maxPlayers}` : ''}
							</dd>
						</div>
						{#if live.query.map}
							<div class="stat">
								<dt><Translate key="servers.live.map" /></dt>
								<dd>{live.query.map}</dd>
							</div>
						{/if}
						{#if live.query.version}
							<div class="stat">
								<dt><Translate key="servers.live.version" /></dt>
								<dd>{live.query.version}</dd>
							</div>
						{/if}
						<div class="stat">
							<dt><Translate key="servers.live.ping" /></dt>
							<dd>{live.query.ping} ms</dd>
						</div>
					{/if}
					{#if live.resources}
						<div class="stat">
							<dt>CPU</dt>
							<dd>{live.resources.cpuPercent.toFixed(1)} %</dd>
						</div>
						<div class="stat">
							<dt><Translate key="servers.live.memory" /></dt>
							<dd>
								{formatBytes(live.resources.memoryBytes)}{live.resources.memoryLimitBytes
									? ` / ${formatBytes(live.resources.memoryLimitBytes)}`
									: ''}
							</dd>
						</div>
					{/if}
					{#if live.startedAt}
						<div class="stat">
							<dt><Translate key="servers.live.uptime" /></dt>
							<dd>{formatUptime(live.startedAt)}</dd>
						</div>
					{/if}
				</dl>
				{#if live.query?.playerNames.length}
					<details class="players">
						<summary><Translate key="servers.live.playerList" /></summary>
						<ul>
							{#each live.query.playerNames as player, i (i)}
								<li>{player}</li>
							{/each}
						</ul>
					</details>
				{/if}
			{/if}

			{#if server.ports.length}
				<div class="connect">
					<span class="field-label"><Translate key="servers.connect" /></span>
					<ul>
						{#each server.ports as port, i (i)}
							<li>
								<CopyText text={`${data.host}:${port.host}`} />
								<span class="muted small"
									>{port.protocol}{port.label ? ` · ${port.label}` : ''}</span
								>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="actions">
				{#if server.status === 'ready'}
					{#if isRunning(server)}
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
							<button class="btn-primary"><Translate key="servers.start" /></button>
						</form>
					{/if}
				{:else if server.status === 'error'}
					<form method="POST" action="?/retry" use:enhance>
						<input type="hidden" name="id" value={server.id} />
						<button class="btn-primary"><Translate key="servers.retry" /></button>
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
					<button class="btn-danger btn-ghost push-right">
						<Translate key="servers.delete" />
					</button>
				</form>
			</div>
		</article>
	{/each}
</div>

{#if data.isAdmin}
	<p class="muted admin-link">
		<a href={resolve('/(authenticated)/container')}><Translate key="servers.containers" /></a>
	</p>
{/if}

<style>
	.list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 30rem), 1fr));
		gap: 1rem;
	}

	.server {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.server > * {
		margin: 0;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	h2 {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.meta {
		margin: 0.15rem 0 0;
		font-size: 0.9rem;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
		gap: 0.5rem;
		margin: 0;
	}

	.stat {
		padding: 0.5rem 0.75rem;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.stat dt {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.stat dd {
		margin: 0;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.stat.highlight {
		background: var(--accent-soft);
	}

	.stat.highlight dd {
		color: var(--accent);
		font-size: 1.25rem;
	}

	.players summary {
		cursor: pointer;
		font-weight: 600;
	}

	.players ul {
		columns: 2;
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
	}

	.connect ul {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
	}

	.connect li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.small {
		font-size: 0.85rem;
	}

	.actions {
		margin-top: auto;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border);
	}

	.push-right {
		margin-left: auto;
	}

	.admin-link {
		margin-top: 1.5rem;
		text-align: center;
	}
</style>
