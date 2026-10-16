import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db/postgres";

/** Supabase free tier database size limit. */
export const ANALYTICS_DB_LIMIT_BYTES = 500 * 1024 * 1024;
const CACHE_SECONDS = 600;

export type AnalyticsTableUsage = { table: string; rows: number; day: number; week: number };

export type AnalyticsDbUsage = {
  sizeBytes: number;
  limitBytes: number;
  tables: AnalyticsTableUsage[];
};

function tableUsage(table: string, timeColumn: string): string {
  return `(select jsonb_build_object('table', '${table}', 'rows', count(*),
    'day', count(*) filter (where ${timeColumn} >= now() - interval '1 day'),
    'week', count(*) filter (where ${timeColumn} >= now() - interval '7 days')) from analytics.${table})`;
}

const USAGE_QUERY = `
  select pg_database_size(current_database())::text as size_bytes,
         jsonb_build_array(
           ${tableUsage("events", "created_at")},
           ${tableUsage("sessions", "started_at")},
           ${tableUsage("visitors", "created_at")},
           ${tableUsage("key_reports", "created_at")}
         ) as tables
`;

async function loadAnalyticsDbUsage(): Promise<AnalyticsDbUsage> {
  const [row] = await db().unsafe<Array<{ sizeBytes: string; tables: AnalyticsTableUsage[] }>>(USAGE_QUERY);
  return { sizeBytes: Number(row.sizeBytes), limitBytes: ANALYTICS_DB_LIMIT_BYTES, tables: row.tables };
}

export const getCachedAnalyticsDbUsage = unstable_cache(loadAnalyticsDbUsage, ["admin-analytics-db-usage"], {
  revalidate: CACHE_SECONDS
});
