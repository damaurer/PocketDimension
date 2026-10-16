<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { User } from '#lib/types.ts';
	import Translate from '#lib/i18n/Translate.svelte';
	import Modal from '#lib/components/Modal.svelte';
	import UserForm from './UserForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showModal = $state(false);
	let activeUser: User | undefined = $state();
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<h1>Account</h1>

<UserForm
	action="?/updateAccount"
	submitButtonText="label.update"
	idPrefix="account"
	user={data.user}
	ownAccount
	form={showModal ? undefined : form}
/>

<form action="/logout" method="POST" class="logout-form">
	<button>
		<Translate key="account.user.button.logout" />
	</button>
</form>

{#if data.isAdmin}
	<hr />

	<div class="flex-row-space-between align-center">
		<h3>
			<Translate key="account.admin.headline" />
		</h3>
		<button
			onclick={() => {
				showModal = true;
				activeUser = undefined;
			}}
		>
			<Translate key="account.admin.user.add" />
		</button>
	</div>
	<div class="flex-row-wrap">
		{#each data.users as user (user.id)}
			<div class="user-card">
				<div class="user-data">
					<span><Translate key="label.email" />: {user.email}</span>
					<span><Translate key="label.name" />: {user.name}</span>
				</div>
				<div>
					<button
						onclick={() => {
							showModal = true;
							activeUser = user;
						}}
						aria-label="Open User Modal"
					>
						<Translate key="account.user.button.edit" />
					</button>
				</div>
			</div>
		{/each}
	</div>

	<Modal bind:showModal showFooter={false}>
		<h2 slot="header">
			<Translate key="account.modal.header" />
		</h2>
		{#key activeUser}
			{#if activeUser}
				<UserForm
					action="?/updateUser"
					submitButtonText="label.update"
					idPrefix="update"
					user={activeUser}
					manageRoles
					{form}
				/>
			{:else}
				<UserForm
					action="?/registerUser"
					submitButtonText="label.create"
					idPrefix="create"
					manageRoles
					{form}
				/>
			{/if}
		{/key}
	</Modal>
{/if}

<style>
	.user-card {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-end;
		border: 1px solid var(--color-theme-1);
		width: 100%;
		margin: 0.2rem;
		padding: 0.2rem;
	}

	.user-data {
		display: flex;
		flex-direction: column;
	}

	h1 {
		margin: 4px 0;
	}

	.logout-form {
		margin-top: 1.5rem;
	}

	hr {
		width: 100%;
	}
</style>
