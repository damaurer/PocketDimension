<script lang="ts">
	import { enhance } from '$app/forms';
	import Translate from '#lib/i18n/Translate.svelte';

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
		| 'docsUrl',
		string
	>;

	let { values, message }: { values: Values; message?: string } = $props();
</script>

<form method="POST" action="?/save" use:enhance class="template-form">
	<label>
		<Translate key="template.name" />
		<input name="name" value={values.name} required maxlength="80" />
	</label>
	<label>
		<Translate key="template.slug" />
		<input
			name="slug"
			value={values.slug}
			required
			pattern="[a-z0-9]+(-[a-z0-9]+)*"
			maxlength="40"
		/>
	</label>
	<label>
		<Translate key="template.description" />
		<textarea name="description" rows="3" maxlength="1000">{values.description}</textarea>
	</label>
	<label>
		<Translate key="template.image" />
		<input name="image" value={values.image} required placeholder="itzg/minecraft-server:latest" />
	</label>
	<label>
		<Translate key="template.ports" />
		<textarea name="ports" rows="4" class="mono">{values.ports}</textarea>
	</label>
	<label>
		<Translate key="template.volumes" />
		<textarea name="volumes" rows="3" class="mono" placeholder="/data">{values.volumes}</textarea>
	</label>
	<label>
		<Translate key="template.env" />
		<textarea name="env" rows="10" class="mono">{values.env}</textarea>
		<small>
			key, label, default, required, secret, options, help &mdash; e.g.
			<code
				>{'{ "key": "EULA", "label": "Accept EULA", "options": ["TRUE"], "required": true }'}</code
			>
		</small>
	</label>
	<label>
		<Translate key="template.memory" />
		<input name="memoryMb" type="number" min="64" value={values.memoryMb} />
	</label>
	<label>
		<Translate key="template.queryType" />
		<input name="queryType" value={values.queryType} placeholder="minecraft" />
	</label>
	<label>
		<Translate key="template.queryPort" />
		<input name="queryPort" type="number" min="0" value={values.queryPort} />
	</label>
	<label>
		<Translate key="template.docsUrl" />
		<input name="docsUrl" type="url" value={values.docsUrl} />
	</label>
	<button><Translate key="template.save" /></button>
</form>

{#if message}
	<p class="error">{message}</p>
{/if}

<style>
	.template-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-width: 40rem;
		margin: 0 auto;
	}

	label {
		display: flex;
		flex-direction: column;
	}

	.mono {
		font-family: var(--font-mono);
	}
</style>
