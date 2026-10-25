<script lang="ts">
	import { enhance } from '$app/forms';
	import Translate from '#lib/i18n/Translate.svelte';
	import { msg } from '#lib/i18n/i18n.ts';

	type Values = Record<
		| 'slug'
		| 'name'
		| 'description'
		| 'image'
		| 'ports'
		| 'env'
		| 'volumes'
		| 'memoryMb'
		| 'queryType'
		| 'queryPort'
		| 'docsUrl'
		| 'thumbnailUrl',
		string
	>;

	let {
		values,
		message,
		slugLocked = false
	}: { values: Values; message?: string; slugLocked?: boolean } = $props();

	const envExample =
		'[{ "key": "EULA", "label": "Accept EULA", "options": ["TRUE"], "required": true }]';
</script>

<form method="POST" action="?/save" use:enhance class="form">
	{#if message}
		<p class="alert error" role="alert">{$msg(message)}</p>
	{/if}

	<fieldset class="card form">
		<legend><Translate key="template.section.general" /></legend>
		<div class="field">
			<label for="t_name"><Translate key="template.name" /></label>
			<input id="t_name" name="name" value={values.name} required maxlength="80" />
		</div>
		<div class="field">
			<label for="t_slug"><Translate key="template.slug" /></label>
			<input
				id="t_slug"
				name="slug"
				value={values.slug}
				required
				pattern="[a-z0-9]+(-[a-z0-9]+)*"
				maxlength="40"
				readonly={slugLocked}
			/>
			<span class="hint"><Translate key="template.slugHint" /></span>
		</div>
		<div class="field">
			<label for="t_description"><Translate key="template.description" /></label>
			<textarea id="t_description" name="description" rows="3" maxlength="1000"
				>{values.description}</textarea
			>
		</div>
		<div class="field">
			<label for="t_docs"><Translate key="template.docsUrl" /></label>
			<input id="t_docs" name="docsUrl" type="url" value={values.docsUrl} />
		</div>
		<div class="field">
			<label for="t_thumbnail"><Translate key="template.thumbnailUrl" /></label>
			<input
				id="t_thumbnail"
				name="thumbnailUrl"
				type="url"
				value={values.thumbnailUrl}
				maxlength="500"
				placeholder="https://"
			/>
			<span class="hint"><Translate key="template.thumbnailHint" /></span>
		</div>
	</fieldset>

	<fieldset class="card form">
		<legend>Docker</legend>
		<div class="field">
			<label for="t_image"><Translate key="template.image" /></label>
			<input
				id="t_image"
				name="image"
				class="mono"
				value={values.image}
				required
				placeholder="itzg/minecraft-server:latest"
			/>
		</div>
		<div class="field">
			<label for="t_ports"><Translate key="template.ports" /></label>
			<textarea id="t_ports" name="ports" rows="4" class="mono" placeholder="25565/tcp Game"
				>{values.ports}</textarea
			>
			<span class="hint"><Translate key="template.portsHint" /></span>
		</div>
		<div class="field">
			<label for="t_volumes"><Translate key="template.volumes" /></label>
			<textarea id="t_volumes" name="volumes" rows="3" class="mono" placeholder="/data"
				>{values.volumes}</textarea
			>
			<span class="hint"><Translate key="template.volumesHint" /></span>
		</div>
		<div class="field">
			<label for="t_memory"><Translate key="template.memory" /></label>
			<input id="t_memory" name="memoryMb" type="number" min="64" value={values.memoryMb} />
		</div>
		<div class="field">
			<label for="t_env"><Translate key="template.env" /></label>
			<textarea id="t_env" name="env" rows="10" class="mono">{values.env}</textarea>
			<span class="hint">
				<Translate key="template.envHint" />
				<code>{envExample}</code>
			</span>
		</div>
	</fieldset>

	<fieldset class="card form">
		<legend><Translate key="template.section.live" /></legend>
		<p class="hint"><Translate key="template.liveHint" /></p>
		<div class="row">
			<div class="field">
				<label for="t_query"><Translate key="template.queryType" /></label>
				<input id="t_query" name="queryType" value={values.queryType} placeholder="minecraft" />
			</div>
			<div class="field">
				<label for="t_query_port"><Translate key="template.queryPort" /></label>
				<input id="t_query_port" name="queryPort" type="number" min="0" value={values.queryPort} />
			</div>
		</div>
	</fieldset>

	<div class="actions">
		<button class="btn-primary"><Translate key="template.save" /></button>
	</div>
</form>

<style>
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1rem;
	}

	legend {
		float: left;
		width: 100%;
	}
</style>
