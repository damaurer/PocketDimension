<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import LanguageSwitch from '#lib/i18n/LanguageSwitch.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="app">
	<header>
		<a href={resolve('/(public)')} class="brand" aria-label="Pocket Dimension">
			<Logo size={32} />
		</a>
		<LanguageSwitch />
	</header>

	<main>
		{@render children()}
	</main>

	<Footer />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background:
			radial-gradient(60rem 30rem at 50% -10%, var(--accent-soft), transparent 70%), var(--bg);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 0.75rem 1rem;
	}

	.brand {
		text-decoration: none;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 2rem 1rem 0;
	}
</style>
