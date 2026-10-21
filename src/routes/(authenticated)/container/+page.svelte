<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { msg, t } from '#lib/i18n/i18n.ts';
	import { ContainerStatus } from '#lib/types.ts';

	let { data }: { data: PageData } = $props();

	let message = $state('');

	async function containerStatus(id: string, status: ContainerStatus) {
		message = '';
		const response = await fetch('/api/container', {
			method: 'POST',
			body: JSON.stringify({ id, status }),
			headers: { 'content-type': 'application/json' }
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			message = body.message ?? `Request failed (${response.status})`;
		}
		await invalidateAll();
	}

	const tone = (state: string) =>
		state === 'running' ? 'badge-success' : state === 'dead' ? 'badge-danger' : '';
</script>

<svelte:head>
	<title>{$t('nav.containers')} · Pocket Dimension</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1><Translate key="containers.title" /></h1>
		<p class="subtitle"><Translate key="containers.intro" /></p>
	</div>
</div>

{#if message}
	<p class="alert error" role="alert">{$msg(message)}</p>
{/if}

<div class="card table-wrap">
	{#await data.containers}
		<p class="muted"><Translate key="containers.loading" /></p>
	{:then containers}
		{#if containers.length}
			<table>
				<thead>
					<tr>
						<th><Translate key="containers.name" /></th>
						<th><Translate key="containers.state" /></th>
						<th><Translate key="games.ports" /></th>
						<th><span class="visually-hidden"><Translate key="containers.actions" /></span></th>
					</tr>
				</thead>
				<tbody>
					{#each containers as container (container.Id)}
						<tr>
							<td>
								<strong>{container.Names.map((n) => n.replace(/^\//, '')).join(', ')}</strong>
								<div class="muted small mono">{container.Id.slice(0, 12)}</div>
							</td>
							<td>
								<span class="badge {tone(container.State)}">{container.State}</span>
								<div class="muted small">{container.Status}</div>
							</td>
							<td class="mono small">
								{container.Ports.filter((p) => p.PublicPort)
									.map((p) => `${p.PublicPort}/${p.Type}`)
									.join(', ') || '–'}
							</td>
							<td>
								<div class="actions">
									<button
										class="btn-small"
										onclick={() => containerStatus(container.Id, ContainerStatus.START)}
									>
										<Translate key="container.button.start" />
									</button>
									<button
										class="btn-small"
										onclick={() => containerStatus(container.Id, ContainerStatus.STOP)}
									>
										<Translate key="container.button.stop" />
									</button>
									<button
										class="btn-small"
										onclick={() => containerStatus(container.Id, ContainerStatus.RESTART)}
									>
										<Translate key="container.button.restart" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p class="muted"><Translate key="containers.empty" /></p>
		{/if}
	{:catch error}
		<p class="alert error">{$msg(error.message)}</p>
	{/await}
</div>

<style>
	.small {
		font-size: 0.8rem;
	}

	.actions {
		justify-content: flex-end;
		flex-wrap: nowrap;
	}
</style>
