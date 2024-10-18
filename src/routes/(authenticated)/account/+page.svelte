<script lang="ts">

	import type { ActionData, PageData } from './$types';
	import Translate from '$lib/i18n/Translate.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import UserForm from './UserForm.svelte';

	export let form: ActionData;
	export let formCreate: ActionData;
	export let formUpdate: ActionData;
	export let data: PageData;


	let showModal = false;
	let activeUser;
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<h1>Account</h1>

<UserForm
	action="?/updateAccount"
	submitButtonText="label.update"
	form={form}
	idPrefix="account"
	{...data}
></UserForm>


<form action="/logout" method="POST" class="logout-form">
	<button>
		<Translate key="account.user.button.logout"></Translate>
	</button>
</form>

{#if data.isAdmin}
	<hr />

	<div class="flex-row-space-between align-center">
		<h3>
			<Translate key="account.admin.headline"></Translate>
		</h3>
		<button on:click={() => {showModal = true; activeUser = undefined}}>
			<Translate key="account.admin.user.add"></Translate>
		</button>
	</div>
	<div class="flex-row-wrap">
		{#await data.users}
			<p>Loading Users...</p>
		{:then users}
			{#each users as user}
				<div class="user-card">
					<div class="user-data">
						<span><Translate key="label.email"></Translate>: {user.email}</span>
						<span><Translate key="label.name"></Translate>: {user.name}</span>
					</div>
					<div>
						<button on:click={()=> {showModal = true; activeUser = user}} aria-label="Open User Modal">
							<Translate key="account.user.button.edit"></Translate>
						</button>
					</div>
				</div>
			{/each}
		{:catch error}
			<p>error loading users: {error.message}</p>
		{/await}
	</div>

	<Modal bind:showModal showFooter={false}>
		<h2 slot="header">
			<Translate key="account.modal.header"></Translate>
		</h2>
		{#if activeUser}
			<UserForm
				action="?/updateUser"
				submitButtonText="label.update"
				form={formUpdate}
				{...activeUser}
			></UserForm>
		{:else }
			<UserForm
				action="?/registerUser"
				submitButtonText="label.create"
				idPrefix="create"
				form={formCreate}
			></UserForm>
		{/if}
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