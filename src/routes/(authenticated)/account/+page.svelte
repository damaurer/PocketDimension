<script lang="ts">
	import { enhance } from "$app/forms";
	import type { ActionData, PageData } from "./$types";
	import Translate from '$lib/i18n/Translate.svelte';
	import AccountCard from '$lib/components/AccountCard.svelte';

	export let form: ActionData;
	export let data: PageData;
</script>

<svelte:head>
	<title>Account</title>
</svelte:head>

<h1>Account</h1>

<form
	action="?/updateUser"
	method="POST"
	autocomplete="off"
	use:enhance
	class="update-form"
>
	<div>
		<label for="name_input">Name</label>
		<input
			type="text"
			id="name_input"
			name="name"
			value={data.name}
		/>
	</div>
	<div>
		<label for="email_input">Email</label>
		<input
			type="email"
			id="email_input"
			name="email"
			value={data.email}
		/>
	</div>
	<button aria-label="update name">Update</button>
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

<form action="/logout" method="POST" class="logout-form">
	<button>Logout</button>
</form>

<hr/>

<div class="flex-row-space-between">
	<h3>
		<Translate key="account.admin.headline"></Translate>
	</h3>
	<button>
		<Translate key="account.admin.user.add"></Translate>
	</button>
</div>
<div class="flex-row-wrap">
	{#each data.users as user}
		<AccountCard user={user}></AccountCard>
	{/each}
</div>



<style>
    .update-form {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: end;
        gap: 1rem;
    }
    .logout-form {
        margin-top: 1.5rem;
    }

		hr {
				width: 100%;
		}
</style>