<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>{data.template.name}</title>
</svelte:head>

<h1>{data.template.name}</h1>
<p class="intro">{data.template.description}</p>

{#if data.maxServers !== null}
	<p class="intro">
		<Translate key="games.limit" variables={{ count: data.serverCount, max: data.maxServers }} />
	</p>
{/if}

<form
	method="POST"
	autocomplete="off"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	}}
>
	<div class="form-field">
		<label for="server_name"><Translate key="games.form.name" /></label>
		<input id="server_name" name="name" required minlength="2" maxlength="40" />
	</div>

	{#each data.template.env as variable (variable.key)}
		<div class="form-field">
			<label for={`env_${variable.key}`}>{variable.label}{variable.required ? ' *' : ''}</label>
			{#if variable.options}
				<select
					id={`env_${variable.key}`}
					name={`env.${variable.key}`}
					required={variable.required}
				>
					{#if !variable.required}
						<option value=""></option>
					{/if}
					{#each variable.options as option (option)}
						<option value={option} selected={option === variable.default}>{option}</option>
					{/each}
				</select>
			{:else}
				<input
					id={`env_${variable.key}`}
					name={`env.${variable.key}`}
					type={variable.secret ? 'password' : 'text'}
					value={variable.default ?? ''}
					required={variable.required}
					maxlength="512"
					autocomplete={variable.secret ? 'new-password' : 'off'}
				/>
			{/if}
			{#if variable.help}
				<small>{variable.help}</small>
			{/if}
		</div>
	{/each}

	{#if data.template.memoryMb}
		<p>
			<Translate key="games.form.memory" />: {data.template.memoryMb >= 1024
				? `${data.template.memoryMb / 1024} GB`
				: `${data.template.memoryMb} MB`}
		</p>
	{/if}

	<button disabled={submitting}><Translate key="games.create" /></button>
</form>

{#if form?.message}
	<p class="error">{form.message}</p>
{/if}

<style>
	.intro {
		text-align: center;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 28rem;
		margin: 0 auto;
	}

	.form-field {
		display: flex;
		flex-direction: column;
	}

	small {
		opacity: 0.8;
	}
</style>
