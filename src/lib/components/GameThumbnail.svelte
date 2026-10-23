<script lang="ts">
	import { resolve } from '$app/paths';

	let {
		game,
		class: className = ''
	}: {
		game: { slug: string; name: string; thumbnailUrl?: string | null };
		class?: string;
	} = $props();

	// Part of the address, so browsers may cache a thumbnail until it changes.
	const version = $derived.by(() => {
		let hash = 0;
		for (const c of `${game.name}\n${game.thumbnailUrl ?? ''}`) {
			hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
		}
		return hash.toString(36);
	});
</script>

<img
	class="thumbnail {className}"
	src="{resolve('/(authenticated)/games/[slug]/thumbnail', { slug: game.slug })}?v={version}"
	alt=""
	width="460"
	height="215"
	loading="lazy"
	decoding="async"
/>

<style>
	.thumbnail {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 460 / 215;
		object-fit: cover;
		background: var(--surface-2);
		border-radius: var(--radius-sm);
	}
</style>
