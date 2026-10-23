<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import type { ActionData, PageData } from './$types';
	import Translate from '#lib/i18n/Translate.svelte';
	import { locale, msg } from '#lib/i18n/i18n.ts';
	import { gameDescription, settingLabel } from '#lib/i18n/catalog.ts';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const memory = $derived(
		data.template.memoryMb
			? data.template.memoryMb >= 1024
				? `${data.template.memoryMb / 1024} GB`
				: `${data.template.memoryMb} MB`
			: null
	);
</script>

<svelte:head>
	<title>{data.template.name} · Pocket Dimension</title>
</svelte:head>

<div class="narrow">
	<a class="back-link" href={resolve('/(authenticated)/games')}>
		&larr; <Translate key="games.back" />
	</a>

	<div class="page-header">
		<div>
			<h1>{data.template.name}</h1>
			<p class="subtitle">{gameDescription($locale, data.template)}</p>
		</div>
	</div>

	<form
		method="POST"
		autocomplete="off"
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
			<label for="server_name"><Translate key="games.form.name" /></label>
			<input id="server_name" name="name" required minlength="2" maxlength="40" />
			<span class="hint"><Translate key="games.form.nameHint" /></span>
		</div>

		{#if data.template.env.length}
			<fieldset class="form">
				<legend><Translate key="games.form.settings" /></legend>
				{#each data.template.env as variable (variable.key)}
					<div class="field">
						<label for={`env_${variable.key}`}>
							{settingLabel($locale, variable.label)}{variable.required ? ' *' : ''}
						</label>
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
							<span class="hint">{variable.help}</span>
						{/if}
					</div>
				{/each}
			</fieldset>
		{/if}

		<div class="alert info">
			<ul class="facts">
				{#if memory}
					<li><Translate key="games.form.memory" />: {memory}</li>
				{/if}
				{#if data.maxServers !== null}
					<li>
						<Translate
							key="games.limit"
							variables={{ count: data.serverCount, max: data.maxServers }}
						/>
					</li>
				{/if}
				<li><Translate key="games.form.firstStart" /></li>
			</ul>
		</div>

		<button class="btn-primary" disabled={submitting}>
			<Translate key={submitting ? 'games.form.creating' : 'games.create'} />
		</button>
	</form>

	{#if data.template.docsUrl}
		<p class="muted docs">
			<a href={data.template.docsUrl} target="_blank" rel="noopener noreferrer external">
				<Translate key="games.docs" />
			</a>
		</p>
	{/if}
</div>

<style>
	.facts {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.9rem;
	}

	.docs {
		margin-top: 1rem;
		text-align: center;
	}
</style>
