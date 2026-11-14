/**
 * @fileoverview User agents an admin flagged as bots (analytics.user_agents.is_bot). Tracking skips them before
 * anything is stored. Loaded at most every few minutes per server instance, so a request costs no extra query.
 */
import { db } from "@/src/lib/db/postgres";
import { MINUTE_MS } from "@/src/lib/time";

const REFRESH_MS = 5 * MINUTE_MS;
/** Must match the length user agents are stored with (append_session). */
const STORED_UA_LENGTH = 500;

let cache: { at: number; flagged: Set<string> } | null = null;
let loading: Promise<Set<string>> | null = null;

async function loadFlagged(): Promise<Set<string>> {
  const rows = await db()<Array<{ ua: string }>>`select ua from analytics.user_agents where is_bot`;
  return new Set(rows.map(r => r.ua));
}

/** True when this user agent was flagged as a bot. Fails open: tracking continues if the list cannot load. */
export async function isFlaggedBotUserAgent(userAgent: string | null | undefined): Promise<boolean> {
  if (!userAgent) return false;
  if (!cache || Date.now() - cache.at > REFRESH_MS) {
    loading ??= loadFlagged()
      .then(flagged => {
        cache = { at: Date.now(), flagged };
        return flagged;
      })
      .catch(err => {
        console.error("[isFlaggedBotUserAgent]", err);
        return cache?.flagged ?? new Set<string>();
      })
      .finally(() => {
        loading = null;
      });
    await loading;
  }
  return cache?.flagged.has(userAgent.slice(0, STORED_UA_LENGTH)) ?? false;
}

/** Drop the cached list on this instance (after the admin flags or unflags a user agent). */
export function forgetFlaggedUserAgents(): void {
  cache = null;
}
