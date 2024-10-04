<script>
	import '../../app.css';
	import github from '$lib/images/github.svg';
	import Locales from '$lib/i18n/Locales.svelte';
	import pdIcon from '$lib/images/reduced_icon.svg';


</script>

<div class="app">
	<header>
		<div class="corner">
			<a href="https://github.com/damaurer/PocketDimension/issues" aria-label="Github Issue Board">
				<img src={github} alt="GitHub" />
			</a>
		</div>


		<div class="corner">
			<Locales></Locales>
		</div>
	</header>

	<main>
		<div>
			<a href="/"  class="icon-container" aria-label="Home Button">
				<img src={pdIcon} alt="Home Button" />
			</a>
		</div>
		<slot />
	</main>
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    main {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        width: 100%;
        max-width: 64rem;
        margin: -40px auto 0;
        box-sizing: border-box;
				align-items: center;
    }

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

		.icon-container img{
				max-height: 400px;
        width: 100%;
				margin-bottom: 20px;
		}

</style>
