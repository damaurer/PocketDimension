<script lang="ts">
	import icon from '#lib/images/reduced_icon.svg';

	let { size = 36 }: { size?: number } = $props();
</script>

<span class="logo">
	<img src={icon} alt="" width={size} height={size} />
	<span>Pocket Dimension</span>
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-weight: 700;
		font-size: 1.1rem;
		color: var(--text);
		white-space: nowrap;
	}

	img {
		object-fit: contain;
	}
</style>
