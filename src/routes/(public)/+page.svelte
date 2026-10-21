<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { msg } from '#lib/i18n/i18n.ts';
	import icon from '#lib/images/reduced_icon.svg';

	let { form }: { form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Pocket Dimension</title>
</svelte:head>

<div class="login">
	<img src={icon} alt="" width="96" height="96" />
	<h1>Pocket Dimension</h1>
	<p class="subtitle"><Translate key="login.tagline" /></p>

	<form
		method="POST"
		class="card form"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		{#if form?.message}
			<p class="alert error" role="alert">{$msg(form.message)}</p>
		{/if}
		<div class="field">
			<label for="email_or_name_input"><Translate key="label.emailorname" /></label>
			<input
				type="text"
				id="email_or_name_input"
				name="email_or_name"
				autocomplete="username"
				required
			/>
		</div>
		<div class="field">
			<label for="password_input"><Translate key="label.password" /></label>
			<input
				type="password"
				id="password_input"
				name="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<button class="btn-primary" disabled={submitting}><Translate key="label.login" /></button>
	</form>

	<p class="muted small">
		<Translate key="login.noAccount" />
		<a href={resolve('/(public)/about')}><Translate key="nav.about" /></a>
	</p>
</div>

<style>
	.login {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 24rem;
		text-align: center;
	}

	h1 {
		margin-top: 0.75rem;
	}

	.subtitle {
		margin-bottom: 1.5rem;
	}

	form {
		width: 100%;
		text-align: left;
	}

	.small {
		margin-top: 1.25rem;
		font-size: 0.9rem;
	}
</style>
