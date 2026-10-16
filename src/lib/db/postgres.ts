/** @fileoverview Supabase Postgres client for the `analytics` schema (server only). */
import postgres from "postgres";

const TIMESTAMP_OIDS = [1114, 1184];

function createClient() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("Missing environment variable: SUPABASE_DB_URL");

  return postgres(url, {
    // Supavisor transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    // snake_case columns -> camelCase keys; timestamps come back as ISO strings like the old Sanity payloads.
    transform: { column: { from: postgres.toCamel } },
    types: {
      isoTimestamp: {
        to: 1184,
        from: TIMESTAMP_OIDS,
        serialize: (value: Date | string) => (value instanceof Date ? value.toISOString() : value),
        parse: (value: string) => new Date(value).toISOString()
      }
    }
  });
}

type Db = ReturnType<typeof createClient>;

const globalForDb = globalThis as unknown as { analyticsDb?: Db };

/** Lazily created so builds and routes that never touch analytics do not need the env var. */
export function db(): Db {
  globalForDb.analyticsDb ??= createClient();
  return globalForDb.analyticsDb;
}
