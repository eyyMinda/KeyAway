/** @fileoverview Plain names for the app's database queries, as shown on the dashboard traffic card (client-safe). */

export type QueryDescription = { name: string; about: string };

/** First match wins, so more specific patterns come first. Patterns run on the query text from pg_stat_statements. */
const QUERY_NAMES: Array<[pattern: RegExp, description: QueryDescription]> = [
  [/^\s*select \* from analytics\./i, { name: "Full table export", about: "A one-off copy of a whole table." }],
  [
    /from analytics\.key_reports\s+where program_slug/i,
    { name: "Program page report bars", about: "Key report counts on each program page." }
  ],
  [
    /from analytics\.key_reports\s+where created_at >=/i,
    { name: "Key report alerts", about: "Keys needing attention (admin header and dashboard)." }
  ],
  [/analytics\.key_reports/i, { name: "Key reports", about: "Filing, renewing and listing key reports." }],
  [/append_session/i, { name: "Visit tracking", about: "Recording page views and clicks into sessions." }],
  [/analytics\.ad_stats/i, { name: "Ad statistics", about: "Ad load, view and click counters." }],
  [
    /insert into analytics\.visitors|update analytics\.visitors/i,
    { name: "Visitor records", about: "Visit counts and tiers per visitor." }
  ],
  [/from analytics\.visitors/i, { name: "Visitor lookups", about: "Visitor tiers, spam flags and contributions." }],
  [
    /rollup_next_day|prune_visitors|daily_stats|daily_sketches/i,
    { name: "Analytics rollup", about: "Nightly daily totals and dashboard ranges past 30 days." }
  ],
  [
    /from analytics\.events e\s+join analytics\.sessions|from analytics\.events/i,
    { name: "Analytics dashboard", about: "Charts and tables on the admin analytics page." }
  ],
  [/from analytics\.sessions/i, { name: "Sessions", about: "The admin sessions list and details." }],
  [/giveaway_draws/i, { name: "Giveaway picker", about: "Giveaways, entrants and winners." }],
  [/user_agents/i, { name: "Browser identifiers", about: "Stored user agents and bot flags." }],
  [
    /pg_catalog\.pg_type/i,
    { name: "Driver type lookup", about: "Read by the database driver on each new connection (now turned off)." }
  ],
  [/pgbouncer\.get_auth/i, { name: "Connection logins", about: "The connection pooler signing in." }]
];

export function describeQuery(query: string): QueryDescription {
  return (
    QUERY_NAMES.find(([pattern]) => pattern.test(query))?.[1] ?? { name: "Other query", about: "Hover for the SQL." }
  );
}
