/** Retention and batch limits for visitor cron bundling. */
import { DAY_MS } from "@/src/lib/time";

/** Visitor docs stay live this long after lastActivityAt before bundling. ~2k/day, so 1 day keeps the live set near 2k. */
export const BUNDLING_RETENTION_DAYS = 1;
export const BUNDLING_RETENTION_MS = BUNDLING_RETENTION_DAYS * DAY_MS;

/** Visitors moved per bundle document and per transaction. */
export const BUNDLE_SIZE = 1000;

/** Max create+append steps per cron invocation. */
export const BUNDLE_MAX_ITERATIONS = 30;

/** Key reports stay live this long before bundling. Alerts read a wider window across live + bundles. */
export const KEY_REPORT_RETENTION_DAYS = 7;
export const KEY_REPORT_RETENTION_MS = KEY_REPORT_RETENTION_DAYS * DAY_MS;

/** Reports moved per key report bundle document. */
export const KEY_REPORT_BUNDLE_CAPACITY = 1000;
