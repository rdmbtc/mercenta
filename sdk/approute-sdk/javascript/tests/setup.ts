/**
 * Vitest global setup — loaded via `setupFiles` in vitest.config.ts.
 *
 * Ensures a consistent, deterministic environment across all test suites.
 */

// Force UTC timezone so date-related assertions are stable regardless
// of the host machine's local timezone.
process.env.TZ = "UTC";
