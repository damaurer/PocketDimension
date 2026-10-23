<script lang="ts">
	import type { Snippet } from 'svelte';
	import Translate from '#lib/i18n/Translate.svelte';

	let {
		showModal = $bindable(),
		header,
		children
	}: { showModal: boolean; header: Snippet; children: Snippet } = $props();

	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (showModal && !dialog.open) dialog.showModal();
		if (!showModal && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	onclose={() => (showModal = false)}
	onclick={(e) => {
		if (e.target === dialog) dialog?.close();
	}}
>
	<div class="content">
		<div class="header">
			{@render header()}
			<button type="button" class="btn-ghost btn-small" onclick={() => dialog?.close()}>
				<Translate key="modal.close" />
			</button>
		</div>
		{@render children()}
	</div>
</dialog>

<style>
	dialog {
		width: min(32rem, calc(100vw - 2rem));
		padding: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--shadow);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}

	.content {
		padding: 1.25rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	dialog[open] {
		animation: zoom 0.2s ease-out;
	}

	@keyframes zoom {
		from {
			transform: scale(0.97);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
</style>
