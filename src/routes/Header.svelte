<script>
	import github from '$lib/images/github.svg';
	import Menu from '$lib/components/Menu.svelte';
	import Locales from '$lib/i18n/Locales.svelte';
</script>

<header>
	<div class="corner">
		<a href="https://github.com/sveltejs/kit">
			<img src={github} alt="GitHub" />
		</a>
	</div>

	<Menu></Menu>

	<div class="corner">
		<Locales></Locales>
	</div>
</header>

<style>
	header {
			position: sticky;
      top: 0;
		display: flex;
		justify-content: space-between;
	}

	.corner {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3em;
		height: 3em;
	}

	.corner img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}


</style>
