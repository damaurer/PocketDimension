<script lang="ts">
	import { locale, locales, saveLocale } from '#lib/i18n/i18n.ts';

	const names: Record<string, string> = { en: 'English', de: 'Deutsch' };
</script>

<div class="switch" role="group" aria-label="Language / Sprache">
	{#each locales as l (l)}
		<button
			type="button"
			class:active={$locale === l}
			aria-pressed={$locale === l}
			title={names[l]}
			onclick={() => saveLocale(l)}
		>
			{l.toUpperCase()}
		</button>
	{/each}
</div>

<style>
	.switch {
		display: inline-flex;
		padding: 0.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	button {
		min-height: 1.9rem;
		padding: 0.15rem 0.55rem;
		border: none;
		border-radius: 0.35rem;
		background: transparent;
		color: var(--text-muted);
		font-size: 0.8rem;
	}

	button.active {
		background: var(--accent-soft);
		color: var(--accent);
	}
</style>
