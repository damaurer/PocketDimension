<script lang="ts">
	import Translate from '#lib/i18n/Translate.svelte';
	import { enhance } from '$app/forms';
	import { Role, type User } from '#lib/types.ts';

	let {
		user = undefined,
		action,
		submitButtonText,
		idPrefix,
		form = undefined,
		ownAccount = false,
		manageRoles = false
	}: {
		user?: User;
		action: string;
		submitButtonText: string;
		idPrefix: string;
		form?: { message?: string; success?: boolean } | null;
		ownAccount?: boolean;
		manageRoles?: boolean;
	} = $props();
</script>

<form {action} method="POST" autocomplete="off" use:enhance class="update-form">
	{#if user && !ownAccount}
		<input type="hidden" name="id" value={user.id} />
	{/if}
	<div class="form-field">
		<label for={`${idPrefix}_name_input`}><Translate key="label.name" /></label>
		<input type="text" id={`${idPrefix}_name_input`} name="name" value={user?.name ?? ''} />
	</div>
	<div class="form-field">
		<label for={`${idPrefix}_email_input`}><Translate key="label.email" /></label>
		<input type="email" id={`${idPrefix}_email_input`} name="email" value={user?.email ?? ''} />
	</div>
	<div class="form-field">
		<label for={`${idPrefix}_password_input`}>
			<Translate key={user ? 'label.newPassword' : 'label.password'} />
		</label>
		<input
			type="password"
			id={`${idPrefix}_password_input`}
			name="password"
			autocomplete="new-password"
		/>
	</div>
	{#if ownAccount}
		<div class="form-field">
			<label for={`${idPrefix}_current_password_input`}>
				<Translate key="label.currentPassword" />
			</label>
			<input
				type="password"
				id={`${idPrefix}_current_password_input`}
				name="currentPassword"
				autocomplete="current-password"
			/>
		</div>
	{/if}
	{#if manageRoles}
		<div class="form-field">
			<label>
				<input
					type="checkbox"
					name="isAdmin"
					checked={user?.roles.includes(Role.ADMINISTRATOR_ROLE) ?? false}
				/>
				<Translate key="label.isAdmin" />
			</label>
		</div>
	{/if}
	<div class="form-field">
		<button><Translate key={submitButtonText} /></button>
	</div>
</form>

{#if form?.message}
	<p class={form.success ? 'success' : 'error'}>
		{form.message}
	</p>
{/if}
