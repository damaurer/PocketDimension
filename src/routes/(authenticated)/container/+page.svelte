<script lang="ts">
	import type { PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { ContainerStatus } from '#lib/types.ts';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let message = $state('');

	async function containerStatus(id: string, status: ContainerStatus) {
		message = '';
		const response = await fetch('/api/container', {
			method: 'POST',
			body: JSON.stringify({ id, status }),
			headers: {
				'content-type': 'application/json'
			}
		});

		if (!response.ok) {
			const body = await response.json().catch(() => ({}));
			message = body.message ?? `Request failed (${response.status})`;
		}
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Pocket Dimension</title>
	<meta name="description" content="Pocket Dimension: Game Server Management" />
</svelte:head>

<section>
	{#if message}
		<p class="error">{message}</p>
	{/if}
	<div class="flex-row-wrap">
		{#await data.containers}
			<p>Loading Containers...</p>
		{:then containers}
			{#each containers as container (container.Id)}
				<div class="container-card">
					<div class="container-data">
						<span>ID: {container.Id.slice(0, 12)}</span>
						<span>Names: {container.Names.join(', ')}</span>
						<span>State: {container.State}</span>
						<span>Status: {container.Status}</span>
						<span>
							Ports: {container.Ports.filter((p) => p.PublicPort)
								.map((p) => `${p.PublicPort}/${p.Type}`)
								.join(', ')}
						</span>
					</div>
					<div class="container-button-group">
						<button
							onclick={() => containerStatus(container.Id, ContainerStatus.START)}
							aria-label="Start Container"
						>
							<Translate key="container.button.start" />
						</button>
						<button
							onclick={() => containerStatus(container.Id, ContainerStatus.STOP)}
							aria-label="Stop Container"
						>
							<Translate key="container.button.stop" />
						</button>
						<button
							onclick={() => containerStatus(container.Id, ContainerStatus.RESTART)}
							aria-label="Restart Container"
						>
							<Translate key="container.button.restart" />
						</button>
					</div>
				</div>
			{:else}
				<p>No managed containers yet.</p>
			{/each}
		{:catch error}
			<p class="error">Error loading containers: {error.message}</p>
		{/await}
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	.container-card {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		border: 1px solid var(--color-theme-1);
		width: 100%;
		margin: 0.2rem;
		padding: 0.2rem;
	}

	.container-data {
		display: flex;
		flex-direction: column;
	}

	.container-button-group {
		display: flex;
		flex-direction: column;
	}
</style>
