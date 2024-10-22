<script lang="ts">

	import type {  PageData } from './$types';
	import Translate from '$lib/i18n/Translate.svelte';
	import { ContainerStatus } from '$lib/types';
	export let data: PageData;

	async function containerStatus(id: string, status: ContainerStatus) {
		const response = await fetch('/api/container', {
			method: 'POST',
			body: JSON.stringify({id, status}),
			headers: {
				'content-type': 'application/json',
			},
		})

		const result = await response.json()

		console.log("UPDATE", result)
	}

</script>

<svelte:head>
	<title>Pocket Dimension</title>
	<meta name="description" content="Pocket Dimension: Game Server Management" />
</svelte:head>

<section>
	{data.network}
	<div class="flex-row-wrap">
		{#await data.containers}
			<p>Loading Containers...</p>
		{:then containers}
			{#each containers as container}
				<div class="container-card">
					<div class="container-data">
						<span>ID: {container.Id}</span>
						<span>Names: {container.Names}</span>
						<span>State : {container.State }</span>
						<span>Status: {container.Status}</span>
						<span>Ip: {data.originIp}:{container.Ports}</span>
					</div>
					<div class="container-button-group">
						<button on:click={()=>containerStatus(container.Id, ContainerStatus.START)} aria-label="Start Container">
							<Translate key="container.button.start"></Translate>
						</button>
						<button on:click={()=>containerStatus(container.Id, ContainerStatus.STOP)} aria-label="Stop Container">
							<Translate key="container.button.stop"></Translate>
						</button>
						<button on:click={()=>containerStatus(container.Id, ContainerStatus.RESTART)} aria-label="Restart Container">
							<Translate key="container.button.restart"></Translate>
						</button>
					</div>
				</div>
			{/each}
		{:catch error}
			<p>error loading container: {error.message}</p>
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
