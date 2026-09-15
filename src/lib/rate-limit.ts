/**
 * In-memory login rate limiter. Acceptable for this project's scale (single
 * admin user, one server instance). It resets on server restart/redeploy and
 * does not share state across multiple instances — if this app is ever run
 * on multiple serverless instances concurrently, each instance tracks its
 * own counts, weakening the limit.
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

type Entry = { failures: number[]; blockedUntil: number | null };

const attempts = new Map<string, Entry>();

export function isRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;

  const now = Date.now();
  if (entry.blockedUntil && entry.blockedUntil > now) {
    return true;
  }
  if (entry.blockedUntil && entry.blockedUntil <= now) {
    attempts.delete(key);
    return false;
  }
  return false;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key) ?? { failures: [], blockedUntil: null };

  entry.failures = entry.failures.filter((t) => now - t < WINDOW_MS);
  entry.failures.push(now);

  if (entry.failures.length >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
  }

  attempts.set(key, entry);
}

export function recordSuccess(key: string): void {
  attempts.delete(key);
}
