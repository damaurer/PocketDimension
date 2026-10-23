<script lang="ts">
	import { resolve } from '$app/paths';
	import Translate from '#lib/i18n/Translate.svelte';
</script>

<svelte:head>
	<title>About · Pocket Dimension</title>
	<meta name="description" content="About Pocket Dimension" />
</svelte:head>

<article class="card about">
	<h1><Translate key="about" /></h1>
	<p><Translate key="about.what" /></p>
	<h2><Translate key="about.how.title" /></h2>
	<ol>
		<li><Translate key="about.how.1" /></li>
		<li><Translate key="about.how.2" /></li>
		<li><Translate key="about.how.3" /></li>
	</ol>
	<h2><Translate key="about.access.title" /></h2>
	<p><Translate key="about.access" /></p>
	<p><a href={resolve('/(public)')}>&larr; <Translate key="about.back" /></a></p>
</article>

<style>
	.about {
		max-width: 40rem;
		width: 100%;
	}

	h2 {
		margin-top: 1.5rem;
	}

	li {
		margin-bottom: 0.4rem;
	}
</style>
