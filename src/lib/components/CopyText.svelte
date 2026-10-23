<script lang="ts">
	import Translate from '#lib/i18n/Translate.svelte';

	let { text }: { text: string } = $props();
	let copied = $state(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			// The clipboard is only available on https and localhost; the text stays selectable.
		}
	}
</script>

<span class="copy">
	<code>{text}</code>
	<button type="button" class="btn-ghost btn-small" onclick={copy}>
		<Translate key={copied ? 'copy.done' : 'copy'} />
	</button>
</span>

<style>
	.copy {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	code {
		user-select: all;
	}
</style>
