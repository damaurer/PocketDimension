<script lang="ts">
	import Translate from '#lib/i18n/Translate.svelte';

	const repository = 'https://github.com/damaurer/PocketDimension';
</script>

<footer>
	<a
		href={`${repository}/blob/main/docs/handbuch.md`}
		target="_blank"
		rel="noopener noreferrer external"
	>
		<Translate key="footer.manual" />
	</a>
	<a href={`${repository}/issues`} target="_blank" rel="noopener noreferrer external">
		<Translate key="footer.issues" />
	</a>
</footer>

<style>
	footer {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
		padding: 2rem 1rem;
		font-size: 0.85rem;
	}

	a {
		color: var(--text-muted);
	}
</style>
