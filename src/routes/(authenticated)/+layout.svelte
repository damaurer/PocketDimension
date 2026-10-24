<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import Logo from '#lib/components/Logo.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import LanguageSwitch from '#lib/i18n/LanguageSwitch.svelte';
	import Translate from '#lib/i18n/Translate.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const links = $derived([
		{ route: '/(authenticated)/servers' as const, key: 'nav.servers' },
		{ route: '/(authenticated)/games' as const, key: 'nav.games' },
		{ route: '/(authenticated)/account' as const, key: 'nav.account' },
		...(data.isAdmin
			? [{ route: '/(authenticated)/container' as const, key: 'nav.containers' }]
			: [])
	]);

	const isCurrent = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
</script>

<div class="app">
	<header>
		<div class="bar">
			<a href={resolve('/(authenticated)/servers')} class="brand" aria-label="Pocket Dimension">
				<Logo size={32} />
			</a>
			<nav aria-label="Main">
				{#each links as link (link.route)}
					<a
						href={resolve(link.route)}
						aria-current={isCurrent(resolve(link.route)) ? 'page' : undefined}
					>
						<Translate key={link.key} />
					</a>
				{/each}
			</nav>
			<div class="tools">
				<LanguageSwitch />
				<span class="user" title={data.user.email}>{data.user.name ?? data.user.email}</span>
				<form action="/logout" method="POST">
					<button class="btn-ghost btn-small"><Translate key="nav.logout" /></button>
				</form>
			</div>
		</div>
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
	}

	header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
		backdrop-filter: blur(8px);
		border-bottom: 1px solid var(--border);
	}

	.bar {
		display: grid;
		grid-template-columns: auto 1fr auto;
		grid-template-areas: 'brand nav tools';
		align-items: center;
		gap: 0.5rem 1.5rem;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 0.6rem 1rem;
	}

	.brand {
		grid-area: brand;
		text-decoration: none;
	}

	nav {
		grid-area: nav;
		display: flex;
		gap: 0.25rem;
		overflow-x: auto;
	}

	nav a {
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		font-weight: 600;
		white-space: nowrap;
		text-decoration: none;
	}

	nav a:hover {
		background: var(--surface-2);
		color: var(--text);
	}

	nav a[aria-current='page'] {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.tools {
		grid-area: tools;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user {
		max-width: 10rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-muted);
		font-size: 0.9rem;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: var(--content-width);
		margin: 0 auto;
		padding: 2rem 1rem 0;
	}

	@media (max-width: 760px) {
		.bar {
			grid-template-columns: 1fr auto;
			grid-template-areas:
				'brand tools'
				'nav nav';
		}

		.user {
			display: none;
		}

		main {
			padding-top: 1.25rem;
		}
	}

	/* Phones: the logo alone, so language switch and logout fit next to it. */
	@media (max-width: 480px) {
		.brand :global(.logo span) {
			display: none;
		}
	}
</style>
