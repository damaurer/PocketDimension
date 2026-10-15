<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Pocket Dimension</title>
</svelte:head>

<form method="POST" use:enhance>
	<div>
		<label for="email_or_name_input">
			<Translate key="label.emailorname" />
		</label>
		<input
			type="text"
			id="email_or_name_input"
			name="email_or_name"
			autocomplete="username"
			required
		/>
	</div>
	<div>
		<label for="password_input">
			<Translate key="label.password" />
		</label>
		<input
			type="password"
			id="password_input"
			name="password"
			autocomplete="current-password"
			required
		/>
	</div>
	<button>
		<Translate key="label.login" />
	</button>
</form>

{#if form?.message}
	<p class="error">
		{form.message}
	</p>
{/if}

<p>
	<Translate key="login.but.why" />
	<a href={resolve('/(public)/about')} aria-label="About">
		<Translate key="nav.about" />
	</a>
</p>
