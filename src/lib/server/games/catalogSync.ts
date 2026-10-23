import type {
	CatalogSyncCounts,
	GameRepository
} from '#lib/server/database/repository/game.repository.ts';
import { parseCatalog } from './catalogEntry.ts';

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 2 * 1024 * 1024;

export interface CatalogSyncResult extends Partial<CatalogSyncCounts> {
	at: string;
	/** Entries that failed validation and were left out. */
	invalid?: string[];
	error?: string;
}

/** Downloads and checks the shared catalog. No credentials are sent. */
export async function fetchCatalog(url: string, fetcher: typeof fetch = fetch) {
	const response = await fetcher(url, {
		signal: AbortSignal.timeout(TIMEOUT_MS),
		headers: { accept: 'application/json' },
		credentials: 'omit',
		redirect: 'follow'
	});
	if (!response.ok) throw new Error(`The catalog answered with HTTP ${response.status}.`);
	const text = await response.text();
	if (text.length > MAX_BYTES) throw new Error('The catalog is too large.');

	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		throw new Error('The catalog is not valid JSON.');
	}
	return parseCatalog(data);
}

/**
 * Keeps the game templates in line with the shared online catalog. New games
 * arrive disabled, so an administrator decides which images may run here.
 */
export class CatalogSync {
	lastResult: CatalogSyncResult | undefined;
	private running: Promise<CatalogSyncResult> | undefined;
	private timer: ReturnType<typeof setInterval> | undefined;

	constructor(
		private games: GameRepository,
		readonly url: string,
		private fetcher: typeof fetch = fetch
	) {}

	get enabled() {
		return this.url !== '';
	}

	run(): Promise<CatalogSyncResult> {
		this.running ??= this.sync().finally(() => (this.running = undefined));
		return this.running;
	}

	/** Syncs now and then every `hours`; 0 = only on request. Failed rounds are logged and retried next time. */
	start(hours: number) {
		if (!this.enabled || hours <= 0 || this.timer) return;
		const round = () =>
			this.run().then((result) => {
				if (result.error) console.warn('Game catalog:', result.error);
			});
		void round();
		this.timer = setInterval(round, hours * 60 * 60 * 1000);
		this.timer.unref();
	}

	private async sync(): Promise<CatalogSyncResult> {
		const at = new Date().toISOString();
		if (!this.enabled) {
			return (this.lastResult = { at, error: 'No catalog address is set (CATALOG_URL).' });
		}
		try {
			const { entries, invalid } = await fetchCatalog(this.url, this.fetcher);
			const counts = await this.games.syncCatalog(entries, { enableNew: false });
			this.lastResult = { at, ...counts, invalid };
		} catch (e) {
			const message =
				e instanceof Error && e.name === 'TimeoutError'
					? 'The catalog did not answer in time.'
					: e instanceof Error
						? e.message
						: String(e);
			this.lastResult = { at, error: `Could not update the game catalog: ${message}` };
		}
		return this.lastResult;
	}
}
