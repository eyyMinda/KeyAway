/** Shared retention and batch limits for analytics + visitor cron bundling. */
export const BUNDLING_RETENTION_DAYS = 2;
export const BUNDLING_RETENTION_MS = BUNDLING_RETENTION_DAYS * 864e5;
export const BUNDLE_SIZE = 1000;
/** Max new bundles created per cron invocation (raised to clear backlog faster). */
export const BUNDLE_MAX_ITERATIONS = 30;
