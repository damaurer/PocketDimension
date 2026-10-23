interface Bucket {
	count: number;
	resetAt: number;
}

/**
 * Fixed-window in-memory rate limiter. Good enough for a single app instance;
 * counters reset when the process restarts.
 */
export class RateLimiter {
	private buckets = new Map<string, Bucket>();

	constructor(
		private readonly limit: number,
		private readonly windowMs: number,
		private readonly now: () => number = Date.now
	) {}

	/** Returns the seconds until the key may try again, or 0 when the attempt is allowed. */
	hit(key: string): number {
		const now = this.now();
		this.prune(now);

		const bucket = this.buckets.get(key);
		if (!bucket || bucket.resetAt <= now) {
			this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
			return 0;
		}

		bucket.count++;
		if (bucket.count > this.limit) {
			return Math.ceil((bucket.resetAt - now) / 1000);
		}
		return 0;
	}

	/** Like `hit`, but does not count an attempt. */
	retryAfter(key: string): number {
		const bucket = this.buckets.get(key);
		const now = this.now();
		if (!bucket || bucket.resetAt <= now || bucket.count <= this.limit) return 0;
		return Math.ceil((bucket.resetAt - now) / 1000);
	}

	reset(key: string) {
		this.buckets.delete(key);
	}

	private prune(now: number) {
		if (this.buckets.size < 10_000) return;
		for (const [key, bucket] of this.buckets) {
			if (bucket.resetAt <= now) this.buckets.delete(key);
		}
	}
}

/** 10 failed logins per IP and account within 15 minutes. */
export const loginLimiter = new RateLimiter(10, 15 * 60 * 1000);

/**
 * 50 failed logins per IP within 15 minutes, whatever account they name, so one
 * address cannot try a password against many accounts.
 */
export const loginFailureLimiter = new RateLimiter(50, 15 * 60 * 1000);
