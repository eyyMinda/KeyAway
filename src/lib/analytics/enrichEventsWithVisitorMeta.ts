import { client } from "@/src/sanity/lib/client";

const HASH_CHUNK = 500;

type VisitorRow = { visitorHash: string; visitTier?: string; isSpammer?: boolean };

async function fetchVisitorMetaByHashes(hashes: string[]): Promise<Map<string, VisitorRow>> {
  const map = new Map<string, VisitorRow>();
  if (!hashes.length) return map;

  for (let i = 0; i < hashes.length; i += HASH_CHUNK) {
    const chunk = hashes.slice(i, i + HASH_CHUNK);
    const live = await client.fetch<VisitorRow[]>(
      `*[_type == "visitor" && visitorHash in $hashes]{ visitorHash, visitTier, isSpammer }`,
      { hashes: chunk }
    );
    for (const row of live ?? []) {
      if (row.visitorHash) map.set(row.visitorHash, row);
    }

    const archived = await client.fetch<VisitorRow[]>(
      `*[_type == "visitorBundle"]{
        "rows": visitors[visitorHash in $hashes]{ visitorHash, visitTier, isSpammer }
      }.rows[]`,
      { hashes: chunk }
    );
    for (const row of archived ?? []) {
      if (row.visitorHash && !map.has(row.visitorHash)) map.set(row.visitorHash, row);
    }
  }

  return map;
}

/** One batched lookup per chunk instead of per-event GROQ subqueries. */
export async function enrichEventsWithVisitorMeta<T extends Record<string, unknown>>(events: T[]): Promise<T[]> {
  const hashes = [
    ...new Set(
      events
        .map(e => (typeof e.ipHash === "string" ? e.ipHash.trim() : ""))
        .filter((h): h is string => Boolean(h))
    )
  ];
  if (!hashes.length) return events;

  const byHash = await fetchVisitorMetaByHashes(hashes);
  return events.map(e => {
    const h = typeof e.ipHash === "string" ? e.ipHash.trim() : "";
    if (!h) return e;
    const v = byHash.get(h);
    if (!v) return e;
    return {
      ...e,
      visitTier: v.visitTier,
      visitorIsSpammer: v.isSpammer === true
    };
  });
}
