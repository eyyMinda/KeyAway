/**
 * @fileoverview Editable program fields shared by the admin program editor (client) and the admin programs
 * API (server): which fields can be written, how to normalize them into Sanity shapes (`_type`, `_key`,
 * references), and the same validation rules Studio applies to the `program` schema.
 */
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import { validateFaqNotExactlyOne, validateProgramActivationEntries } from "@/src/sanity/validators/program";
import type { ProgramFlow } from "@/src/types/program";
import { compact, image, isObj, keyed, newKey, portableText, str, strings, type Obj } from "@/src/lib/admin/sanityShapes";

/** Version-check sources (kept in sync with `lib/versions/versionSources.ts`, which is server only). */
export const VERSION_SOURCES = ["installer", "page", "winget", "chocolatey", "homebrew"] as const;

export const PROGRAM_FLOWS: readonly ProgramFlow[] = ["cd_key", "link_based_cdkey", "account", "link_based_account"];
export const PROGRAM_PLATFORMS = ["windows", "mac"] as const;
export const MAX_ABOUT_SECTIONS = 4;
export const MAX_META_TITLE = 70;
export const MAX_META_DESC = 160;

/** Program fields the admin editor may set. Everything else (comments, stats, …) is never touched. */
export const EDITABLE_PROGRAM_FIELDS = [
  "title",
  "slug",
  "vendor",
  "categories",
  "platforms",
  "programFlow",
  "latestOfficialVersion",
  "downloadLink",
  "description",
  "affiliatePro",
  "freeVsProComparison",
  "seo",
  "image",
  "aboutSections",
  "faq",
  "featured",
  "giveawayDiscovery",
  "versionCheck",
  "cdKeys"
] as const;
export type EditableProgramField = (typeof EDITABLE_PROGRAM_FIELDS)[number];
export type ProgramFields = Partial<Record<EditableProgramField, unknown>>;

export type ProgramEditorTab = "basics" | "content" | "keys" | "media" | "seo";

export interface ProgramFieldError {
  /** Field path, e.g. `title`, `aboutSections.1.description`, `faq`. */
  field: string;
  tab: ProgramEditorTab;
  message: string;
}

const FIELD_TAB: Record<EditableProgramField, ProgramEditorTab> = {
  title: "basics",
  slug: "basics",
  vendor: "basics",
  categories: "basics",
  platforms: "basics",
  programFlow: "basics",
  latestOfficialVersion: "basics",
  downloadLink: "basics",
  affiliatePro: "basics",
  description: "content",
  freeVsProComparison: "content",
  aboutSections: "content",
  faq: "content",
  cdKeys: "keys",
  image: "media",
  featured: "media",
  seo: "seo",
  giveawayDiscovery: "seo",
  versionCheck: "basics"
};

export function tabOfField(field: string): ProgramEditorTab {
  return FIELD_TAB[field.split(".")[0] as EditableProgramField] ?? "basics";
}

export { newKey };

export function normalizeSlug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------------------------------------
// Normalization (input -> Sanity shapes)
// ---------------------------------------------------------------------------------------------------------

function isoDate(v: unknown): string | undefined {
  const s = str(v, 40);
  if (!s) return undefined;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? s : new Date(ms).toISOString();
}

const NORMALIZERS: Record<EditableProgramField, (v: unknown) => unknown> = {
  title: v => str(v, 200) ?? "",
  slug: v => {
    const raw = isObj(v) ? v.current : v;
    return { _type: "slug", current: normalizeSlug(typeof raw === "string" ? raw : "") };
  },
  vendor: v => {
    const ref = isObj(v) ? str(v._ref, 200) : str(v, 200);
    return ref ? { _type: "reference", _ref: ref } : null;
  },
  categories: v =>
    keyed(v, "reference", item => {
      const ref = str(item._ref, 200);
      return ref ? { _ref: ref } : null;
    }),
  platforms: v => [...new Set(strings(v).filter(p => (PROGRAM_PLATFORMS as readonly string[]).includes(p)))],
  programFlow: v => (typeof v === "string" && (PROGRAM_FLOWS as readonly string[]).includes(v) ? v : "cd_key"),
  latestOfficialVersion: v => str(v, 60) ?? null,
  downloadLink: v => str(v) ?? null,
  description: portableText,
  affiliatePro: v => {
    if (!isObj(v)) return null;
    const out = compact({
      affiliateProUrl: str(v.affiliateProUrl),
      affiliateProLabel: str(v.affiliateProLabel, 120)
    });
    return Object.keys(out).length ? out : null;
  },
  freeVsProComparison: v =>
    keyed(v, "freeVsProRow", item => compact({ feature: str(item.feature, 200), free: str(item.free, 300), pro: str(item.pro, 300) })),
  seo: v => {
    if (!isObj(v)) return null;
    const out = compact({
      metaTitle: str(v.metaTitle, 300),
      metaDescription: str(v.metaDescription, 1000),
      metaKeywords: strings(v.metaKeywords)
    });
    return Object.keys(out).length ? out : null;
  },
  image,
  aboutSections: v =>
    keyed(v, "aboutSection", item =>
      compact({
        sectionTitle: str(item.sectionTitle, 200),
        description: portableText(item.description),
        image: image(item.image) ?? undefined,
        invertDesktop: item.invertDesktop === true ? true : undefined,
        invertMobile: item.invertMobile === true ? true : undefined,
        points: keyed(item.points, "aboutPoint", p =>
          compact({ text: portableText(p.text), icon: image(p.icon) ?? undefined })
        )
      })
    ),
  faq: v =>
    keyed(v, "faqItem", item => compact({ question: str(item.question, 500), answer: portableText(item.answer) })),
  featured: v => {
    if (!isObj(v)) return null;
    const out = compact({ description: portableText(v.description), showcaseGif: image(v.showcaseGif) ?? undefined });
    return Object.keys(out).length ? out : null;
  },
  giveawayDiscovery: v => {
    if (!isObj(v)) return null;
    const out = compact({ aliases: strings(v.aliases), ignore: v.ignore === true ? true : undefined });
    return Object.keys(out).length ? out : null;
  },
  versionCheck: v => {
    if (!isObj(v)) return null;
    const source = typeof v.source === "string" && (VERSION_SOURCES as readonly string[]).includes(v.source) ? v.source : undefined;
    if (!source) return null;
    return compact({
      source,
      packageId: source !== "page" && source !== "installer" ? str(v.packageId, 200) : undefined,
      installerUrl: source === "installer" ? str(v.installerUrl) : undefined,
      pageUrl: source === "page" ? str(v.pageUrl) : undefined,
      pattern: source === "page" ? str(v.pattern, 300) : undefined,
      autoApply: v.autoApply === true ? true : undefined
    });
  },
  cdKeys: v =>
    keyed(v, "cdKey", item =>
      compact({
        key: str(item.key, 200),
        status: str(item.status, 20) ?? "new",
        version: str(item.version, 60),
        validFrom: isoDate(item.validFrom),
        validUntil: isoDate(item.validUntil),
        createdAt: isoDate(item.createdAt),
        accountLabel: str(item.accountLabel, 120),
        username: str(item.username, 200),
        password: str(item.password, 200),
        giveawayLinks: keyed(item.giveawayLinks, "giveawayLink", l =>
          compact({ title: str(l.title, 120), url: str(l.url), note: str(l.note, 200) })
        )
      })
    )
};

/** Picks the editable fields from `input` and normalizes each. Unknown fields are reported, not written. */
export function normalizeProgramFields(input: unknown): { fields: ProgramFields; unknown: string[] } {
  const fields: ProgramFields = {};
  const unknown: string[] = [];
  if (!isObj(input)) return { fields, unknown };
  for (const [name, value] of Object.entries(input)) {
    if (!(EDITABLE_PROGRAM_FIELDS as readonly string[]).includes(name)) {
      unknown.push(name);
      continue;
    }
    fields[name as EditableProgramField] = NORMALIZERS[name as EditableProgramField](value);
  }
  return { fields, unknown };
}

// ---------------------------------------------------------------------------------------------------------
// Validation (mirrors the Studio schema rules)
// ---------------------------------------------------------------------------------------------------------

function isUrl(v: unknown): boolean {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Validates a whole program (normalized shapes). Pass the merged document when only some fields changed. */
export function validateProgramFields(doc: ProgramFields): ProgramFieldError[] {
  const errors: ProgramFieldError[] = [];
  const add = (field: string, message: string) => errors.push({ field, tab: tabOfField(field), message });

  if (!str(doc.title)) add("title", "Title is required");
  const slug = isObj(doc.slug) ? doc.slug.current : undefined;
  if (typeof slug !== "string" || !slug) add("slug", "Slug is required");
  else if (!/^[a-z0-9-]+$/.test(slug)) add("slug", "Only lowercase letters, numbers, and hyphens");
  if (!isObj(doc.vendor) || !doc.vendor._ref) add("vendor", "Vendor is required");
  if (!Array.isArray(doc.platforms) || doc.platforms.length === 0) add("platforms", "Pick at least one platform");
  if (!portableTextHasContent(doc.description)) add("description", "Description is required");
  if (doc.downloadLink && !isUrl(doc.downloadLink)) add("downloadLink", "Download link must be a valid URL");

  const affiliate = isObj(doc.affiliatePro) ? doc.affiliatePro : {};
  if (affiliate.affiliateProUrl && !isUrl(affiliate.affiliateProUrl)) {
    add("affiliatePro.affiliateProUrl", "Affiliate URL must be a valid URL");
  }

  const about = Array.isArray(doc.aboutSections) ? (doc.aboutSections as Obj[]) : [];
  if (about.length > MAX_ABOUT_SECTIONS) add("aboutSections", `At most ${MAX_ABOUT_SECTIONS} about sections`);
  about.forEach((s, i) => {
    if (!portableTextHasContent(s.description)) add(`aboutSections.${i}.description`, `About section ${i + 1}: description is required`);
    (Array.isArray(s.points) ? (s.points as Obj[]) : []).forEach((p, j) => {
      if (!portableTextHasContent(p.text)) add(`aboutSections.${i}.points.${j}`, `About section ${i + 1}, point ${j + 1}: text is required`);
    });
  });

  const faq = Array.isArray(doc.faq) ? (doc.faq as Obj[]) : [];
  const faqCheck = validateFaqNotExactlyOne(faq);
  if (faqCheck !== true) add("faq", faqCheck);
  faq.forEach((f, i) => {
    if (!str(f.question)) add(`faq.${i}.question`, `FAQ ${i + 1}: question is required`);
    if (!portableTextHasContent(f.answer)) add(`faq.${i}.answer`, `FAQ ${i + 1}: answer is required`);
  });

  (Array.isArray(doc.freeVsProComparison) ? (doc.freeVsProComparison as Obj[]) : []).forEach((r, i) => {
    if (!str(r.feature)) add(`freeVsProComparison.${i}`, `Free vs PRO row ${i + 1}: feature is required`);
  });

  const vc = isObj(doc.versionCheck) ? doc.versionCheck : null;
  if (vc?.source === "page" && !isUrl(vc.pageUrl)) add("versionCheck.pageUrl", "Version tracking: enter the page URL");
  if (vc?.source === "installer" && !isUrl(vc.installerUrl)) add("versionCheck.installerUrl", "Version tracking: enter the installer URL");
  if (vc && vc.source !== "page" && vc.source !== "installer" && !str(vc.packageId)) {
    add("versionCheck.packageId", "Version tracking: enter the package id");
  }
  if (vc?.pattern) {
    try {
      new RegExp(String(vc.pattern));
    } catch {
      add("versionCheck.pattern", "Version tracking: the pattern is not a valid regular expression");
    }
  }

  const keysCheck = validateProgramActivationEntries(doc.cdKeys, doc.programFlow);
  if (keysCheck !== true) add("cdKeys", keysCheck);
  (Array.isArray(doc.cdKeys) ? (doc.cdKeys as Obj[]) : []).forEach((k, i) => {
    if (k.validUntil && Number.isNaN(Date.parse(String(k.validUntil)))) add(`cdKeys.${i}`, `Row #${i + 1}: invalid valid-until date`);
    (Array.isArray(k.giveawayLinks) ? (k.giveawayLinks as Obj[]) : []).forEach((l, j) => {
      if (l.url && !isUrl(l.url)) add(`cdKeys.${i}`, `Row #${i + 1}: link #${j + 1} URL is invalid`);
      if (!str(l.title)) add(`cdKeys.${i}`, `Row #${i + 1}: link #${j + 1} needs a title`);
    });
  });

  return errors;
}
