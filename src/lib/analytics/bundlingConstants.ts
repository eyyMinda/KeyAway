/** Retention and batch limits for visitor cron bundling. */

/** Visitor docs stay live this long after lastActivityAt before bundling. */
export const BUNDLING_RETENTION_DAYS = 2;
export const BUNDLING_RETENTION_MS = BUNDLING_RETENTION_DAYS * 864e5;

/** Visitors moved per bundle document and per transaction. */
export const BUNDLE_SIZE = 1000;

/** Max create+append steps per cron invocation. */
export const BUNDLE_MAX_ITERATIONS = 30;
