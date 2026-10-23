/**
 * @fileoverview Normalizers shared by the admin program and vendor editors: turn loosely typed input into
 * Sanity shapes (`_key`s on array items, `_type`s, image references). Isomorphic.
 */
export type Obj = Record<string, unknown>;

export function newKey(): string {
  return `k${Math.random().toString(36).slice(2, 11)}`;
}

export const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
export const str = (v: unknown, max = 2000): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
export const strings = (v: unknown, max = 200): string[] =>
  Array.isArray(v) ? v.map(x => str(x, max)).filter((x): x is string => !!x) : [];

/** Drops undefined / empty-string / empty-array / empty-object properties. */
export function compact<T extends Obj>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(
      ([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && !(isObj(v) && !Object.keys(v).length)
    )
  ) as T;
}

export function keyed<T extends Obj>(items: unknown, type: string, map: (item: Obj) => T | null): (T & { _key: string })[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter(isObj)
    .map(item => {
      const out = map(item);
      if (!out) return null;
      return { _key: str(item._key, 64) ?? newKey(), _type: type, ...out };
    })
    .filter((x): x is T & { _key: string; _type: string } => !!x);
}

export function portableText(v: unknown): Obj[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObj).map(block => ({
    ...block,
    _key: str(block._key, 64) ?? newKey(),
    _type: str(block._type, 64) ?? "block",
    ...(Array.isArray(block.children) && {
      children: block.children.filter(isObj).map(c => ({ ...c, _key: str(c._key, 64) ?? newKey() }))
    }),
    ...(Array.isArray(block.markDefs) && {
      markDefs: block.markDefs.filter(isObj).map(d => ({ ...d, _key: str(d._key, 64) ?? newKey() }))
    })
  }));
}

/** Keeps hotspot/crop/preserveAnimation; null when no asset is referenced. */
export function image(v: unknown): Obj | null {
  if (!isObj(v) || !isObj(v.asset)) return null;
  const ref = str(v.asset._ref, 200);
  if (!ref) return null;
  return compact({
    _type: "image",
    asset: { _type: "reference", _ref: ref },
    hotspot: isObj(v.hotspot) ? v.hotspot : undefined,
    crop: isObj(v.crop) ? v.crop : undefined,
    preserveAnimation: typeof v.preserveAnimation === "boolean" ? v.preserveAnimation : undefined
  });
}
