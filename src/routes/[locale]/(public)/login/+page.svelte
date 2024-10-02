<script lang="ts">
	import type { PageData, ActionData } from './$types';

	export let data: PageData;

	export let form: ActionData;
</script>


<form method="POST" action="?/login">
	{#if form?.missing}<p class="error">The email field is required</p>{/if}
	{#if form?.incorrect}<p class="error">Invalid credentials!</p>{/if}
	{#if form?.success}<p>Successfully logged in! Welcome back, {data.user.name}</p>{/if}

	<label>
		Email
		<input name="email" type="email" value={form?.email ?? ''}>
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
</form>
