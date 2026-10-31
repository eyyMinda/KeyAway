/** @fileoverview Supabase Postgres client for the `analytics` schema (server only). */
import postgres from "postgres";

const TIMESTAMP_OIDS = [1114, 1184];
/** Longest a query may wait, queueing included. The driver has no limit, so a dead connection would hang forever. */
const QUERY_TIMEOUT_MS = 60_000;

function createClient() {
  const url = process.env.SUPABASE_DB_URL;
  if (!url) throw new Error("Missing environment variable: SUPABASE_DB_URL");
  // Fail without echoing the URL: it contains the database password.
  if (!URL.canParse(url)) throw new Error("SUPABASE_DB_URL is not a valid URL. URL-encode the password (e.g. % -> %25, # -> %23, @ -> %40).");

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

const isTaggedTemplate = (args: unknown[]) => Array.isArray(args[0]) && "raw" in args[0];

/** Replaces a pool that stopped answering, so one dead connection cannot block every later request. */
function discardPool(pool: Db, client: Db) {
  if (globalForDb.analyticsDb === client) globalForDb.analyticsDb = undefined;
  void pool.end({ timeout: 0 }).catch(() => {});
}

/**
 * Fails queries that outlive `QUERY_TIMEOUT_MS`, so callers reach their error handling and fallbacks. The clock
 * starts on `await`: nested fragments are built with the same tag and never run on their own.
 */
function withQueryTimeout(pool: Db): Db {
  const client: Db = new Proxy(pool, {
    apply(target, thisArg, args) {
      const query = Reflect.apply(target, thisArg, args);
      if (!isTaggedTemplate(args)) return query;

      const run = query.then.bind(query);
      let settled: Promise<unknown> | undefined;
      query.then = (onResolved: never, onRejected: never) => {
        settled ??= new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            discardPool(pool, client);
            reject(new Error(`Database query timed out after ${QUERY_TIMEOUT_MS}ms`));
          }, QUERY_TIMEOUT_MS);
          run(resolve, reject).finally(() => clearTimeout(timer));
        });
        return settled.then(onResolved, onRejected);
      };
      return query;
    }
  });
  return client;
}

/** Lazily created so builds and routes that never touch analytics do not need the env var. */
export function db(): Db {
  globalForDb.analyticsDb ??= withQueryTimeout(createClient());
  return globalForDb.analyticsDb;
}
