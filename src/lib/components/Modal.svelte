<script lang="ts">
	import Translate from '#lib/i18n/Translate.svelte';

	export let showModal: boolean;
	export let showFooter = true;

	let dialog: HTMLDialogElement;

	$: if (dialog && showModal) dialog.showModal();
	else if (dialog && !showModal) dialog.close();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
	<div on:click|stopPropagation>
		<slot name="header" />
		<hr />
		<slot />
		{#if showFooter}
			<hr />
			<div class="dialog-footer">
				<!-- svelte-ignore a11y_autofocus -->
				<button autofocus on:click={() => dialog.close()}>
					<Translate key="modal.close" />
				</button>
			</div>
		{/if}
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}

	dialog > div {
		padding: 1em;
	}

	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}

	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.dialog-footer {
		display: flex;
		justify-content: center;
	}
</style>
