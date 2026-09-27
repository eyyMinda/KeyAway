import { randomUUID } from "node:crypto";
import { SESSION_BUNDLE_CAPACITY, SESSION_IDLE_MS } from "@/src/lib/analytics/sessionConstants";
import { client } from "@/src/sanity/lib/client";

const BATCH = 40;

type LiveSession = Record<string, unknown> & { _id: string; startedAt?: string; lastEventAt?: string };

async function fetchIdleSessions(cutoff: string, limit: number): Promise<LiveSession[]> {
  return client.fetch<LiveSession[]>(
    `*[_type == "trackingSession" && lastEventAt < $cutoff] | order(lastEventAt asc) [0...$limit]`,
    { cutoff, limit }
  );
}

function toBundledSession(doc: LiveSession) {
  const { _id, _rev, _type, _createdAt, _updatedAt, ...rest } = doc;
  void _id;
  void _rev;
  void _type;
  void _createdAt;
  void _updatedAt;
  return { _key: randomUUID(), ...rest };
}

/** Move idle sessions into `trackingSessionBundle` so only open visits stay as documents. */
export async function runBundleSessions(): Promise<{ ok: boolean; bundled: number; error?: string }> {
  const cutoff = new Date(Date.now() - SESSION_IDLE_MS).toISOString();
  let bundled = 0;

  try {
    for (let i = 0; i < 20; i++) {
      const open = await client.fetch<{ _id: string; sessionCount: number; capacity?: number } | null>(
        `*[_type == "trackingSessionBundle" && origin != "migration" && sessionCount < coalesce(capacity, $cap)] | order(timeRangeEnd desc)[0]{
          _id, sessionCount, capacity
        }`,
        { cap: SESSION_BUNDLE_CAPACITY }
      );

      const room = open ? (open.capacity ?? SESSION_BUNDLE_CAPACITY) - open.sessionCount : BATCH;
      const limit = Math.min(BATCH, Math.max(room, 0));
      if (open && limit <= 0) break;

      const docs = await fetchIdleSessions(cutoff, open ? limit : BATCH);
      if (!docs.length) break;

      const sessions = docs.map(toBundledSession);
      const start = (docs[0].startedAt as string) ?? cutoff;
      const end = (docs[docs.length - 1].lastEventAt as string) ?? cutoff;
      const now = new Date().toISOString();
      const tx = client.transaction();

      if (open) {
        tx.patch(open._id, p =>
          p.append("sessions", sessions).set({
            sessionCount: open.sessionCount + sessions.length,
            timeRangeEnd: end,
            updatedAt: now
          })
        );
      } else {
        tx.create({
          _type: "trackingSessionBundle",
          bundledAt: now,
          updatedAt: now,
          timeRangeStart: start,
          timeRangeEnd: end,
          sessionCount: sessions.length,
          capacity: SESSION_BUNDLE_CAPACITY,
          sessions
        });
      }

      for (const doc of docs) tx.delete(doc._id);
      await tx.commit();
      bundled += docs.length;
    }

    return { ok: true, bundled };
  } catch (err) {
    console.error("[bundle-sessions]", err);
    return { ok: false, bundled, error: err instanceof Error ? err.message : "Session bundling failed" };
  }
}
