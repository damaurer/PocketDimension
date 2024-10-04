<script>
import Translate from '$lib/i18n/Translate.svelte';
import { enhance } from "$app/forms";

export let name
export let email
export let password

export let submitButtonText

export let action

export let form

export let idPrefix

</script>

<form
	action={action}
	method="POST"
	autocomplete="off"
	use:enhance
	class="update-form"
>
	<div class="form-field">
		<label for="name_input"><Translate key="label.name"></Translate></label>
		<input
			type="text"
			id={`${idPrefix}_name_input`}
			name="name"
			value={name}
		/>
	</div>
	<div class="form-field">
		<label for="email_input"><Translate key="label.email"></Translate></label>
		<input
			type="email"
			id={`${idPrefix}_email_input`}
			name="email"
			value={email}
		/>
	</div>
	<div class="form-field">
		<label for="email_input"><Translate key="label.password"></Translate></label>
		<input
			type="password"
			id={`${idPrefix}_password_input`}
			name="password"
			value={password}
		/>
	</div>
	<div class="form-field">
		<button aria-label="update name"><Translate key={submitButtonText}></Translate></button>
	</div>
</form>

{#if form?.message}
	<p class="success">
		{form.message}
	</p>
{/if}

{#if form?.error}
	<p class="error">
		{form.error}
	</p>
{/if}