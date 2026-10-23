/**
 * @fileoverview Admin program editor state: Sanity program doc -> editable form, and form -> Sanity field
 * values. Rich text is edited as Markdown; a field whose Markdown was not changed returns its original
 * Portable Text untouched, so opening and saving never rewrites content you did not edit.
 */
import { markdownToPortableText, portableTextToMarkdown, isMarkdownLossless } from "@/src/lib/portableText/markdown";
import { EDITABLE_PROGRAM_FIELDS, VERSION_SOURCES, newKey, normalizeSlug, type ProgramFields } from "@/src/lib/admin/programFields";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import type { AdminProgramDoc } from "@/src/types/admin";
import type { CDKeyStatus, ProgramFlow, ProgramPlatform } from "@/src/types/program";

type Obj = Record<string, unknown>;

export interface RichText {
  md: string;
  /** Portable Text as loaded; returned as-is while `md` still equals `originalMd`. */
  original?: unknown;
  originalMd?: string;
  /** The original uses formatting Markdown cannot express (saving an edit would drop it). */
  lossy?: boolean;
}

export interface ImageValue {
  assetId: string | null;
  /** Image object as loaded (keeps hotspot/crop while the asset stays the same). */
  original?: Obj | null;
  preserveAnimation?: boolean;
}

export interface GiveawayLinkForm {
  _key: string;
  title: string;
  url: string;
  note: string;
}

export interface KeyRowForm {
  _key: string;
  key: string;
  status: CDKeyStatus;
  version: string;
  /** `datetime-local` values; the loaded ISO strings are kept so untouched dates are not reformatted. */
  validFrom: string;
  validUntil: string;
  origValidFrom?: string;
  origValidUntil?: string;
  createdAt?: string;
  accountLabel: string;
  username: string;
  password: string;
  giveawayLinks: GiveawayLinkForm[];
}

export interface AboutPointForm {
  _key: string;
  text: RichText;
  icon: ImageValue;
}

export interface AboutSectionForm {
  _key: string;
  sectionTitle: string;
  description: RichText;
  image: ImageValue;
  invertDesktop: boolean;
  invertMobile: boolean;
  points: AboutPointForm[];
}

export interface FaqForm {
  _key: string;
  question: string;
  answer: RichText;
}

export interface FreeVsProForm {
  _key: string;
  feature: string;
  free: string;
  pro: string;
}

export interface ProgramForm {
  title: string;
  slug: string;
  vendorId: string;
  categories: { _key: string; _ref: string }[];
  platforms: ProgramPlatform[];
  programFlow: ProgramFlow;
  latestOfficialVersion: string;
  downloadLink: string;
  description: RichText;
  affiliateProUrl: string;
  affiliateProLabel: string;
  freeVsPro: FreeVsProForm[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  image: ImageValue;
  about: AboutSectionForm[];
  faq: FaqForm[];
  featuredCopy: RichText;
  showcaseGif: ImageValue;
  aliases: string[];
  ignoreInScan: boolean;
  versionSource: "" | (typeof VERSION_SOURCES)[number];
  versionPackageId: string;
  versionPageUrl: string;
  versionInstallerUrl: string;
  versionPattern: string;
  versionAutoApply: boolean;
  cdKeys: KeyRowForm[];
}

// ---------------------------------------------------------------------------------------------------------
// Small converters
// ---------------------------------------------------------------------------------------------------------

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const s = (v: unknown): string => (typeof v === "string" ? v : "");
const objs = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

export function richText(value: unknown): RichText {
  const md = portableTextToMarkdown(value);
  return { md, original: value, originalMd: md, lossy: !isMarkdownLossless(value) };
}

export function emptyRichText(md = ""): RichText {
  return { md };
}

export function richTextValue(rt: RichText): unknown[] {
  if (Array.isArray(rt.original) && rt.md === rt.originalMd) return rt.original;
  return markdownToPortableText(rt.md);
}

export function imageValue(value: unknown): ImageValue {
  if (!isObj(value) || !isObj(value.asset) || typeof value.asset._ref !== "string") return { assetId: null };
  return { assetId: value.asset._ref, original: value, preserveAnimation: value.preserveAnimation === true };
}

export function imageField(img: ImageValue, withAnimationFlag = false): Obj | null {
  if (!img.assetId) return null;
  const base: Obj =
    img.original && isObj(img.original.asset) && img.original.asset._ref === img.assetId
      ? { ...img.original }
      : { _type: "image", asset: { _type: "reference", _ref: img.assetId } };
  if (withAnimationFlag) {
    if (img.preserveAnimation) base.preserveAnimation = true;
    else delete base.preserveAnimation;
  }
  return base;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO string -> `datetime-local` value in the browser's time zone. */
export function isoToLocalInput(iso: unknown): string {
  if (typeof iso !== "string" || !iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string, original?: string): string | undefined {
  if (!local) return undefined;
  if (original && isoToLocalInput(original) === local) return original;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Drops undefined / empty-string / empty-array properties. */
function compact(o: Obj): Obj {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
  );
}

const trimOrNull = (v: string): string | null => v.trim() || null;

// ---------------------------------------------------------------------------------------------------------
// Doc <-> form
// ---------------------------------------------------------------------------------------------------------

export function newKeyRow(defaults: Partial<KeyRowForm> = {}): KeyRowForm {
  return {
    _key: newKey(),
    key: "",
    status: "new",
    version: "",
    validFrom: "",
    validUntil: "",
    createdAt: new Date().toISOString(),
    accountLabel: "",
    username: "",
    password: "",
    giveawayLinks: [],
    ...defaults
  };
}

export function newAboutSection(): AboutSectionForm {
  return {
    _key: newKey(),
    sectionTitle: "",
    description: emptyRichText(),
    image: { assetId: null },
    invertDesktop: false,
    invertMobile: false,
    points: []
  };
}

/** Editable form for a loaded program, or an empty one for a new program. */
export function docToForm(doc: AdminProgramDoc | null): ProgramForm {
  const d: Obj = doc ?? {};
  const seo = isObj(d.seo) ? d.seo : {};
  const affiliate = isObj(d.affiliatePro) ? d.affiliatePro : {};
  const featured = isObj(d.featured) ? d.featured : {};
  const discovery = isObj(d.giveawayDiscovery) ? d.giveawayDiscovery : {};
  const versionCheck = isObj(d.versionCheck) ? d.versionCheck : {};
  const platforms = strs(d.platforms).filter((p): p is ProgramPlatform => p === "windows" || p === "mac");

  return {
    title: s(d.title),
    slug: isObj(d.slug) ? s(d.slug.current) : "",
    vendorId: isObj(d.vendor) ? s(d.vendor._ref) : "",
    categories: objs(d.categories)
      .filter(c => typeof c._ref === "string")
      .map(c => ({ _key: s(c._key) || newKey(), _ref: c._ref as string })),
    platforms: doc ? platforms : ["windows"],
    programFlow: normalizeProgramFlow(d.programFlow),
    latestOfficialVersion: s(d.latestOfficialVersion),
    downloadLink: s(d.downloadLink),
    description: doc ? richText(d.description) : emptyRichText(),
    affiliateProUrl: s(affiliate.affiliateProUrl),
    affiliateProLabel: s(affiliate.affiliateProLabel),
    freeVsPro: objs(d.freeVsProComparison).map(r => ({
      _key: s(r._key) || newKey(),
      feature: s(r.feature),
      free: s(r.free),
      pro: s(r.pro)
    })),
    metaTitle: s(seo.metaTitle),
    metaDescription: s(seo.metaDescription),
    metaKeywords: strs(seo.metaKeywords),
    image: imageValue(d.image),
    about: objs(d.aboutSections).map(a => ({
      _key: s(a._key) || newKey(),
      sectionTitle: s(a.sectionTitle),
      description: richText(a.description),
      image: imageValue(a.image),
      invertDesktop: a.invertDesktop === true,
      invertMobile: a.invertMobile === true,
      points: objs(a.points).map(p => ({ _key: s(p._key) || newKey(), text: richText(p.text), icon: imageValue(p.icon) }))
    })),
    faq: objs(d.faq).map(f => ({ _key: s(f._key) || newKey(), question: s(f.question), answer: richText(f.answer) })),
    featuredCopy: featured.description ? richText(featured.description) : emptyRichText(),
    showcaseGif: imageValue(featured.showcaseGif),
    aliases: strs(discovery.aliases),
    ignoreInScan: discovery.ignore === true,
    versionSource: (VERSION_SOURCES as readonly string[]).includes(s(versionCheck.source))
      ? (versionCheck.source as ProgramForm["versionSource"])
      : "",
    versionPackageId: s(versionCheck.packageId),
    versionPageUrl: s(versionCheck.pageUrl),
    versionInstallerUrl: s(versionCheck.installerUrl),
    versionPattern: s(versionCheck.pattern),
    versionAutoApply: versionCheck.autoApply === true,
    cdKeys: objs(d.cdKeys).map(k => ({
      _key: s(k._key) || newKey(),
      key: s(k.key),
      status: (["new", "active", "expired", "limit"].includes(s(k.status)) ? k.status : "new") as CDKeyStatus,
      version: s(k.version),
      validFrom: isoToLocalInput(k.validFrom),
      validUntil: isoToLocalInput(k.validUntil),
      origValidFrom: s(k.validFrom) || undefined,
      origValidUntil: s(k.validUntil) || undefined,
      createdAt: s(k.createdAt) || undefined,
      accountLabel: s(k.accountLabel),
      username: s(k.username),
      password: s(k.password),
      giveawayLinks: objs(k.giveawayLinks).map(l => ({
        _key: s(l._key) || newKey(),
        title: s(l.title),
        url: s(l.url),
        note: s(l.note)
      }))
    }))
  };
}

/** Saved shape of the version-tracking settings (only the fields the chosen source uses). */
export function versionCheckValue(f: ProgramForm): Obj | null {
  if (!f.versionSource) return null;
  const page = f.versionSource === "page";
  const installer = f.versionSource === "installer";
  return compact({
    source: f.versionSource,
    packageId: page || installer ? undefined : f.versionPackageId.trim(),
    installerUrl: installer ? f.versionInstallerUrl.trim() : undefined,
    pageUrl: page ? f.versionPageUrl.trim() : undefined,
    pattern: page ? f.versionPattern.trim() : undefined,
    autoApply: f.versionAutoApply || undefined
  });
}

/** Every editable field as the Sanity value it would be saved as (`null` = unset). */
export function formToFields(f: ProgramForm): Required<ProgramFields> {
  const affiliatePro = compact({ affiliateProUrl: f.affiliateProUrl.trim(), affiliateProLabel: f.affiliateProLabel.trim() });
  const seo = compact({
    metaTitle: f.metaTitle.trim(),
    metaDescription: f.metaDescription.trim(),
    metaKeywords: f.metaKeywords.map(k => k.trim()).filter(Boolean)
  });
  const featuredDescription = f.featuredCopy.md.trim() ? richTextValue(f.featuredCopy) : undefined;
  const featured = compact({ description: featuredDescription, showcaseGif: imageField(f.showcaseGif) ?? undefined });
  const discovery = compact({
    aliases: f.aliases.map(a => a.trim()).filter(Boolean),
    ignore: f.ignoreInScan || undefined
  });

  return {
    title: f.title.trim(),
    slug: { _type: "slug", current: normalizeSlug(f.slug) },
    vendor: f.vendorId ? { _type: "reference", _ref: f.vendorId } : null,
    categories: f.categories.map(c => ({ _key: c._key, _type: "reference", _ref: c._ref })),
    platforms: f.platforms,
    programFlow: f.programFlow,
    latestOfficialVersion: trimOrNull(f.latestOfficialVersion),
    downloadLink: trimOrNull(f.downloadLink),
    description: richTextValue(f.description),
    affiliatePro: Object.keys(affiliatePro).length ? affiliatePro : null,
    freeVsProComparison: f.freeVsPro.map(r =>
      compact({ _key: r._key, _type: "freeVsProRow", feature: r.feature.trim(), free: r.free.trim(), pro: r.pro.trim() })
    ),
    seo: Object.keys(seo).length ? seo : null,
    image: imageField(f.image),
    aboutSections: f.about.map(a =>
      compact({
        _key: a._key,
        _type: "aboutSection",
        sectionTitle: a.sectionTitle.trim(),
        description: richTextValue(a.description),
        image: imageField(a.image, true) ?? undefined,
        invertDesktop: a.invertDesktop || undefined,
        invertMobile: a.invertMobile || undefined,
        points: a.points.map(p =>
          compact({ _key: p._key, _type: "aboutPoint", text: richTextValue(p.text), icon: imageField(p.icon) ?? undefined })
        )
      })
    ),
    faq: f.faq.map(q => compact({ _key: q._key, _type: "faqItem", question: q.question.trim(), answer: richTextValue(q.answer) })),
    featured: Object.keys(featured).length ? featured : null,
    giveawayDiscovery: Object.keys(discovery).length ? discovery : null,
    versionCheck: versionCheckValue(f),
    cdKeys: f.cdKeys.map(k =>
      compact({
        _key: k._key,
        _type: "cdKey",
        key: k.key.trim(),
        status: k.status,
        version: k.version.trim(),
        validFrom: localInputToIso(k.validFrom, k.origValidFrom),
        validUntil: localInputToIso(k.validUntil, k.origValidUntil),
        createdAt: k.createdAt,
        accountLabel: k.accountLabel.trim(),
        username: k.username.trim(),
        password: k.password.trim(),
        giveawayLinks: k.giveawayLinks.map(l =>
          compact({ _key: l._key, _type: "giveawayLink", title: l.title.trim(), url: l.url.trim(), note: l.note.trim() })
        )
      })
    )
  } as Required<ProgramFields>;
}

/** `_key`s are ignored: freshly converted Markdown gets new random keys on every conversion. */
const comparable = (v: unknown) => JSON.stringify(v, (k, val) => (k === "_key" ? undefined : val));

/** Fields whose saved value differs between two form states. */
export function changedFields(base: ProgramForm, current: ProgramForm): ProgramFields {
  const a = formToFields(base);
  const b = formToFields(current);
  const out: ProgramFields = {};
  for (const field of EDITABLE_PROGRAM_FIELDS) {
    if (comparable(a[field]) !== comparable(b[field])) out[field] = b[field];
  }
  return out;
}
