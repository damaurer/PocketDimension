<script>
	import {  locale } from '$lib/i18n/i18n.ts';
	import { page } from '$app/stores';
	import pdIcon from '$lib/images/reduced_icon.svg';
	import Translate from '$lib/i18n/Translate.svelte';
</script>


<nav>
	<ul>
		<li aria-current={$page.url.pathname === "/games" ? 'page' : undefined}>
			<svg viewBox="0 0 2 3" aria-hidden="true">
				<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
			</svg>
			<a href="/games">
				<Translate key="nav.games"></Translate>
			</a>
			<svg viewBox="0 0 2 3" aria-hidden="true">
				<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
			</svg>
		</li>
		<li aria-current={$page.url.pathname === "/container"  ? 'page' : undefined}>
			<a href="/container"  class="icon-container" aria-label="Home Button">
				<img src={pdIcon} alt="Home Button" />
			</a>
		</li>
		<li aria-current={$page.url.pathname === "/about" ? 'page' : undefined}>
			<svg viewBox="0 0 2 3" aria-hidden="true">
				<path d="M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z" />
			</svg>
			<a href="/about">
				<Translate key="nav.about"></Translate>
			</a>
			<svg viewBox="0 0 2 3" aria-hidden="true">
				<path d="M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z" />
			</svg>
		</li>
	</ul>
</nav>

<style>
    img {
        width: 60px;
    }

    nav {
        display: flex;
        justify-content: center;
        --background: rgba(255, 255, 255, 0.7);
    }

    svg {
        width: 2em;
        height: 3em;
        display: block;
    }

    path {
        fill: var(--background);
    }

    ul {
        position: relative;
        padding: 0;
        margin: 0;
        height: 3em;
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
        background-size: contain;
    }

		li > a:not(.icon-container) {
        background: var(--background);
		}

    li {
        position: relative;
        height: 100%;
				display: flex;
				flex-direction: row;
    }

    li[aria-current='page']::before {
        --size: 6px;
        content: '';
        width: 0;
        height: 0;
        position: absolute;
        top: 0;
        left: calc(50% - var(--size));
        border: var(--size) solid transparent;
        border-top: var(--size) solid var(--color-theme-1);
    }

		li a.icon-container {
				margin-top: 10px;
				transition: 1s;
		}

    li[aria-current='page'] a.icon-container {
				margin-top: 20px;
    }

    nav a {
        display: flex;
        height: 100%;
        align-items: center;
        padding: 0 0.5rem;
        color: var(--color-text);
        font-weight: 700;
        font-size: 0.8rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        text-decoration: none;
        transition: color 0.2s linear;
    }

    a:hover {
        color: var(--color-theme-1);
    }

		@media screen {

    }
</style>