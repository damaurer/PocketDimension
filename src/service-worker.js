/// <reference types="@sveltejs/kit" />
import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { resolve } from '$app/paths';

// Create a unique cache name for this deployment
const CACHE = `pd-cache-${version}`;

// Only the app bundle and the files in `static` are cached. Pages and API
// responses contain per-user data and must never end up in the cache.
const ASSETS = [...immutable, ...assets].map(({ path }) => resolve(path));

self.addEventListener('install', (event) => {
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin || !ASSETS.includes(url.pathname)) return;

	async function respond() {
		const cache = await caches.open(CACHE);
		const cached = await cache.match(url.pathname);
		return cached ?? fetch(event.request);
	}

	event.respondWith(respond());
});
