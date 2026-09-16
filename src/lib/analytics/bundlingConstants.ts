/** Shared retention and batch limits for analytics + visitor cron bundling. */

/** Visitor docs stay live this long after lastActivityAt before bundling. */
export const BUNDLING_RETENTION_DAYS = 2;
export const BUNDLING_RETENTION_MS = BUNDLING_RETENTION_DAYS * 864e5;

/**
 * Live `trackingEvent` window. Cron lag is extra (bundle-events runs every 6h).
 * 12h is the quota lever — bundle size barely moves document count.
 */
export const EVENT_BUNDLING_RETENTION_HOURS = 12;
export const EVENT_BUNDLING_RETENTION_MS = EVENT_BUNDLING_RETENTION_HOURS * 3600e3;

/** Visitor bundles + per-transaction event batch (Sanity mutation size). */
export const BUNDLE_SIZE = 1000;

/** Legacy event bundles without `capacity` stay capped here and are never refilled past it. */
export const LEGACY_EVENT_BUNDLE_SIZE = 1000;

/** New event bundles fill to this (5x). Existing 1000-count docs are left as-is. */
export const EVENT_BUNDLE_CAPACITY = 5000;

/** Events moved per create/append transaction (keep aligned with BUNDLE_SIZE). */
export const EVENT_BUNDLE_BATCH = BUNDLE_SIZE;

/** Max create+append steps per cron invocation (raised to clear backlog faster). */
export const BUNDLE_MAX_ITERATIONS = 30;
