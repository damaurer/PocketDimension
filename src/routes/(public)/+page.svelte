<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData } from "./$types";
	import Translate from '$lib/i18n/Translate.svelte';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Pocket Dimension</title>
</svelte:head>


<form method="POST" autocomplete="off" use:enhance>
	<div>
		<label for="email_input">
			<Translate key="label.email"></Translate>
		</label>
		<input
			type="email"
			id="email_input"
			name="email"
		/>
	</div>
	<div>
		<label for="password_input">
			<Translate key="label.password"></Translate>
		</label>
		<input type="password" id="password_input" name="password" />
	</div>
	<button>
		<Translate key="label.login"></Translate>
	</button>
</form>

{#if form?.user}
	<p class="success">
		<Translate key="login.welcome" variables={{name: form.user.name}}></Translate>

	</p>
{/if}

{#if form?.status}
	<p class="error">
		{form?.data?.message}
	</p>
{/if}


<p>
	<Translate key="login.but.why"></Translate>
	<a href="/about" aria-label="About">
		<Translate key="nav.about"></Translate>
	</a>
</p>