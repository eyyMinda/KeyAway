/** @fileoverview Admin vendor editor state: Sanity vendor doc <-> editable form (see `programForm.ts`). */
import { EDITABLE_VENDOR_FIELDS, type VendorFields } from "@/src/lib/admin/vendorFields";
import { newKey, normalizeSlug } from "@/src/lib/admin/programFields";
import { emptyRichText, imageValue, richText, richTextValue, imageField, type ImageValue, type RichText } from "../programs/editor/programForm";
import type { AdminVendorDoc } from "@/src/types/admin";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: unknown): string => (typeof v === "string" ? v : "");

export interface ComparisonRowForm {
  _key: string;
  feature: string;
  giveaway: string;
  officialPro: string;
}

export interface VendorForm {
  name: string;
  slug: string;
  description: RichText;
  logo: ImageValue;
  bgEnabled: boolean;
  bgHex: string;
  /** 0–100 */
  bgOpacity: number;
  bgOriginal?: Obj;
  metaTitle: string;
  metaDescription: string;
  aliases: string[];
  comparison: ComparisonRowForm[];
}

export function vendorDocToForm(doc: AdminVendorDoc | null): VendorForm {
  const d: Obj = doc ?? {};
  const seo = isObj(d.seo) ? d.seo : {};
  const bg = isObj(d.logoBackgroundColor) ? d.logoBackgroundColor : null;
  const alpha = bg && typeof bg.alpha === "number" ? bg.alpha : 1;
  return {
    name: s(d.name),
    slug: isObj(d.slug) ? s(d.slug.current) : "",
    description: doc ? richText(d.description ?? []) : emptyRichText(),
    logo: imageValue(d.logo),
    bgEnabled: !!bg?.hex,
    bgHex: s(bg?.hex) || "#ffffff",
    bgOpacity: Math.round(alpha * 100),
    bgOriginal: bg ?? undefined,
    metaTitle: s(seo.metaTitle),
    metaDescription: s(seo.metaDescription),
    aliases: Array.isArray(d.aliases) ? d.aliases.filter((a): a is string => typeof a === "string") : [],
    comparison: (Array.isArray(d.giveawayVsOfficial) ? d.giveawayVsOfficial.filter(isObj) : []).map(r => ({
      _key: s(r._key) || newKey(),
      feature: s(r.feature),
      giveaway: s(r.giveaway),
      officialPro: s(r.officialPro)
    }))
  };
}

export function vendorFormToFields(f: VendorForm): Required<VendorFields> {
  const alpha = f.bgOpacity / 100;
  const sameColor = f.bgOriginal && s(f.bgOriginal.hex).toLowerCase() === f.bgHex.toLowerCase() && f.bgOriginal.alpha === alpha;
  const seo = Object.fromEntries(
    Object.entries({ metaTitle: f.metaTitle.trim(), metaDescription: f.metaDescription.trim() }).filter(([, v]) => v)
  );
  return {
    name: f.name.trim(),
    slug: { _type: "slug", current: normalizeSlug(f.slug) },
    description: f.description.md.trim() ? richTextValue(f.description) : null,
    logo: imageField(f.logo),
    logoBackgroundColor: f.bgEnabled ? (sameColor ? f.bgOriginal : { hex: f.bgHex, alpha }) : null,
    seo: Object.keys(seo).length ? seo : null,
    aliases: f.aliases.map(a => a.trim()).filter(Boolean),
    giveawayVsOfficial: f.comparison.map(r =>
      Object.fromEntries(
        Object.entries({
          _key: r._key,
          _type: "giveawayComparisonRow",
          feature: r.feature.trim(),
          giveaway: r.giveaway.trim(),
          officialPro: r.officialPro.trim()
        }).filter(([, v]) => v)
      )
    )
  } as Required<VendorFields>;
}

const comparable = (v: unknown) => JSON.stringify(v ?? null, (k, val) => (k === "_key" ? undefined : val));

export function changedVendorFields(base: VendorForm, current: VendorForm): VendorFields {
  const a = vendorFormToFields(base);
  const b = vendorFormToFields(current);
  const out: VendorFields = {};
  for (const field of EDITABLE_VENDOR_FIELDS) {
    if (comparable(a[field]) !== comparable(b[field])) out[field] = b[field];
  }
  return out;
}
