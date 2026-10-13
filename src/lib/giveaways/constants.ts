/**
 * Fixed id with a dot: Sanity only returns documents under a path to authenticated requests,
 * so the giveaway source list stays out of the public dataset API (and out of this public repo).
 */
export const GIVEAWAY_DISCOVERY_SETTINGS_ID = "giveawayDiscovery.settings";

/** Private list of keys/accounts the admin marked as unusable (e.g. activation limit reached). */
export const GIVEAWAY_IGNORED_ITEMS_ID = "giveawayDiscovery.ignoredItems";

/** Private per-watch-page state (WordPress REST id + last modified time), written by the cron. */
export const GIVEAWAY_WATCH_STATE_ID = "giveawayDiscovery.watchState";

/** Prefix for `giveawayFind` ids. The dot keeps finds (which hold source URLs) private as well. */
export const GIVEAWAY_FIND_ID_PREFIX = "giveawayFind.";
