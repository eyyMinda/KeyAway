/**
 * @fileoverview Editable vendor fields shared by the admin vendor editor (client) and the admin vendors API
 * (server): normalization into Sanity shapes and the same rules the Studio `vendor` schema applies.
 */
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import { normalizeSlug } from "@/src/lib/admin/programFields";
import { compact, image, isObj, keyed, portableText, str, strings } from "@/src/lib/admin/sanityShapes";

export const EDITABLE_VENDOR_FIELDS = [
  "name",
  "slug",
  "description",
  "logo",
  "logoBackgroundColor",
  "seo",
  "aliases",
  "giveawayVsOfficial"
] as const;
export type EditableVendorField = (typeof EDITABLE_VENDOR_FIELDS)[number];
export type VendorFields = Partial<Record<EditableVendorField, unknown>>;

export interface VendorFieldError {
  field: string;
  message: string;
}

/** `#rgb` / `#rrggbb` -> Sanity color-input shape (hex + alpha + rgb), as the site's logo tile reads it. */
export function hexToSanityColor(hex: string, alpha = 1): Record<string, unknown> | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const full = m[1].length === 3 ? [...m[1]].map(c => c + c).join("") : m[1];
  const n = parseInt(full, 16);
  const a = Math.min(1, Math.max(0, alpha));
  return {
    _type: "color",
    hex: `#${full.toLowerCase()}`,
    alpha: a,
    rgb: { _type: "rgbaColor", r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a }
  };
}

const NORMALIZERS: Record<EditableVendorField, (v: unknown) => unknown> = {
  name: v => str(v, 120) ?? "",
  slug: v => {
    const raw = isObj(v) ? v.current : v;
    return { _type: "slug", current: normalizeSlug(typeof raw === "string" ? raw : "") };
  },
  description: portableText,
  logo: image,
  logoBackgroundColor: v => {
    if (!isObj(v) || typeof v.hex !== "string") return null;
    const alpha = typeof v.alpha === "number" ? v.alpha : 1;
    const color = hexToSanityColor(v.hex, alpha);
    // Keep Studio's extra color shapes (hsl/hsv) when the color itself did not change.
    return color && v.hex.toLowerCase() === color.hex && alpha === color.alpha ? { ...v, ...color } : color;
  },
  seo: v => {
    if (!isObj(v)) return null;
    const out = compact({ metaTitle: str(v.metaTitle, 300), metaDescription: str(v.metaDescription, 1000) });
    return Object.keys(out).length ? out : null;
  },
  aliases: v => strings(v),
  giveawayVsOfficial: v =>
    keyed(v, "giveawayComparisonRow", item =>
      compact({ feature: str(item.feature, 200), giveaway: str(item.giveaway, 300), officialPro: str(item.officialPro, 300) })
    )
};

export function normalizeVendorFields(input: unknown): { fields: VendorFields; unknown: string[] } {
  const fields: VendorFields = {};
  const unknown: string[] = [];
  if (!isObj(input)) return { fields, unknown };
  for (const [name, value] of Object.entries(input)) {
    if (!(EDITABLE_VENDOR_FIELDS as readonly string[]).includes(name)) {
      unknown.push(name);
      continue;
    }
    fields[name as EditableVendorField] = NORMALIZERS[name as EditableVendorField](value);
  }
  return { fields, unknown };
}

export function validateVendorFields(doc: VendorFields): VendorFieldError[] {
  const errors: VendorFieldError[] = [];
  if (!str(doc.name)) errors.push({ field: "name", message: "Name is required" });
  const slug = isObj(doc.slug) ? doc.slug.current : undefined;
  if (typeof slug !== "string" || !slug) errors.push({ field: "slug", message: "Slug is required" });
  else if (!/^[a-z0-9-]+$/.test(slug)) errors.push({ field: "slug", message: "Only lowercase letters, numbers, and hyphens" });
  (Array.isArray(doc.giveawayVsOfficial) ? doc.giveawayVsOfficial : []).forEach((r, i) => {
    if (!isObj(r) || !str(r.feature)) errors.push({ field: `giveawayVsOfficial.${i}`, message: `Comparison row ${i + 1}: feature is required` });
  });
  if (doc.description !== undefined && Array.isArray(doc.description) && doc.description.length && !portableTextHasContent(doc.description)) {
    errors.push({ field: "description", message: "Description is empty" });
  }
  return errors;
}
