<script>
	import { locales, locale } from '$lib/i18n/i18n.ts';

	import flagEn from '$lib/i18n/flags/gb.svg';
	import flagDe from '$lib/i18n/flags/de.svg';
	import Modal from '$lib/components/Modal.svelte';
	import Translate from '$lib/i18n/Translate.svelte';

	let showModal = false;

	let flags = {
		en: flagEn,
		de: flagDe
	};


</script>

<button on:click={()=> (showModal = true)} aria-label="Open Language Modal">
	<img src={flags[$locale]} alt="Flag">
</button>

<Modal bind:showModal showFooter={false}>
	<h2 slot="header">
		<Translate key="local.modal.header"></Translate>
	</h2>
	<ul>
		{#each locales as l}
			<li>
				<button on:click={()=>{
					$locale = l;
					showModal = false;
				}}>
					<img src={flags[l]} alt="Flag"/>
					<Translate key={"local."+l}></Translate>
				</button>
			</li>
		{/each}
	</ul>
</Modal>

<style>

    button {
        background: none;
        color: inherit;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
        outline: inherit;
				display: flex;
				flex-direction: row;
				align-items: center;
		}

    button img {
        height: 22px;
        width: auto;
    }

		ul {
				list-style: none;
				padding-left: 0;
		}

		li {
				padding: 0.5rem;
		}

		li button img {
				margin-right: 0.5rem;
		}

</style>