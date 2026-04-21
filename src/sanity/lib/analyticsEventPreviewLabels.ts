/** Labels for Sanity list previews — no runtime dependency on Studio-only bundles. */

const EVENT_DISPLAY: Record<string, string> = {
  page_viewed: "View",
  download_click: "Download",
  social_click: "Social",
  copy_cdkey: "Copy"
};

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeAnalyticsEventName(event?: string | null): string {
  if (!event?.trim()) return "Event";
  const key = event.trim();
  return EVENT_DISPLAY[key] ?? slugToTitle(key.replace(/_/g, "-"));
}

export function normalizeAnalyticsPathLabel(path?: string | null, programSlug?: string | null): string {
  const raw = (path ?? "").trim();
  const p = raw || "/";

  if (p === "/" || p === "") return "Homepage";

  if (/^\/programs\/?(\?|$)/.test(p)) return "Programs";

  const fromPath = /^\/program\/([^/?#]+)/.exec(p);
  const slug = (fromPath?.[1] ?? programSlug ?? "").trim();
  if (slug) return slugToTitle(slug);

  const first = p.replace(/^\/+/, "").split(/[/?#]/)[0] ?? "";
  if (first) {
    if (first === "studio") return "Studio";
    if (first === "admin") return "Admin";
    return slugToTitle(first);
  }

  return raw || "Unknown page";
}

export function analyticsEventPreviewTitle(
  event?: string | null,
  path?: string | null,
  programSlug?: string | null
): string {
  return `${normalizeAnalyticsEventName(event)} - ${normalizeAnalyticsPathLabel(path, programSlug)}`;
}

/** Second row: `Country, City - shortHash` */
export function analyticsEventPreviewSubtitle(
  country?: string | null,
  city?: string | null,
  ipHash?: string | null,
  hashMax = 10
): string {
  const loc = [country?.trim(), city?.trim()].filter(Boolean).join(", ");
  const h = ipHash?.trim() ?? "";
  const short = h.length > hashMax ? `${h.slice(0, hashMax)}…` : h;
  if (loc && short) return `${loc} - ${short}`;
  if (loc) return loc;
  if (short) return short;
  return "—";
}
