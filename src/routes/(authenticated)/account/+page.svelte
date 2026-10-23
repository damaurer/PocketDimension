<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { Role, type User } from '#lib/types.ts';
	import Translate from '#lib/i18n/Translate.svelte';
	import { t } from '#lib/i18n/i18n.ts';
	import Modal from '#lib/components/Modal.svelte';
	import UserForm from './UserForm.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showModal = $state(false);
	let activeUser: User | undefined = $state();

	function openUser(user?: User) {
		activeUser = user;
		showModal = true;
	}
</script>

<svelte:head>
	<title>{$t('nav.account')} · Pocket Dimension</title>
</svelte:head>

<div class="page-header">
	<div>
		<h1><Translate key="account.title" /></h1>
		<p class="subtitle"><Translate key="account.intro" /></p>
	</div>
</div>

<div class="layout">
	<section class="card">
		<h2><Translate key="account.profile" /></h2>
		<UserForm
			action="?/updateAccount"
			submitButtonText="label.update"
			idPrefix="account"
			user={data.user}
			ownAccount
			form={showModal ? undefined : form}
		/>
	</section>

	{#if data.isAdmin}
		<section class="card">
			<div class="section-header">
				<h2><Translate key="account.admin.headline" /></h2>
				<button class="btn-primary btn-small" onclick={() => openUser()}>
					+ <Translate key="account.admin.user.add" />
				</button>
			</div>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th><Translate key="label.name" /></th>
							<th><Translate key="label.email" /></th>
							<th><Translate key="account.role" /></th>
							<th
								><span class="visually-hidden"><Translate key="account.user.button.edit" /></span
								></th
							>
						</tr>
					</thead>
					<tbody>
						{#each data.users as user (user.id)}
							<tr>
								<td>{user.name ?? '–'}</td>
								<td>{user.email}</td>
								<td>
									{#if user.roles.includes(Role.ADMINISTRATOR_ROLE)}
										<span class="badge badge-plain"><Translate key="label.isAdmin" /></span>
									{:else}
										<span class="muted"><Translate key="account.role.user" /></span>
									{/if}
								</td>
								<td class="edit">
									<button class="btn-ghost btn-small" onclick={() => openUser(user)}>
										<Translate key="account.user.button.edit" />
									</button>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="muted"><Translate key="account.admin.noUsers" /></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<Modal bind:showModal>
			{#snippet header()}
				<h2>
					<Translate key={activeUser ? 'account.modal.edit' : 'account.admin.user.add'} />
				</h2>
			{/snippet}
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
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 24rem), 1fr));
		gap: 1rem;
		align-items: start;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.section-header h2 {
		margin: 0;
	}

	td {
		overflow-wrap: anywhere;
	}

	.edit {
		text-align: right;
	}
</style>
