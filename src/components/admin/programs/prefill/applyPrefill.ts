/** @fileoverview Applies a prefill result (scraped or AI-written) to the program / vendor editor forms. */
import { newKey } from "@/src/lib/admin/programFields";
import type { PrefillProgram, PrefillVendor } from "@/src/lib/prefill/prefillFormat";
import { emptyRichText, type ProgramForm } from "../editor/programForm";
import type { EditorLookups } from "../editor/types";
import type { VendorForm } from "../../vendors/vendorForm";

export type ProgramPrefillGroup =
  | "identity"
  | "version"
  | "download"
  | "description"
  | "about"
  | "faq"
  | "freeVsPro"
  | "seo"
  | "aliases"
  | "image";

export type VendorPrefillGroup = "identity" | "description" | "aliases" | "comparison" | "seo" | "logo";

export interface PrefillGroupInfo<G extends string> {
  id: G;
  label: string;
  /** One-line preview of what would be applied; null = nothing in the result for this group. */
  preview: string | null;
  /** The form already has content here (unchecked by default). */
  filled: boolean;
}

/** Downloads an image URL into Sanity; resolves to the asset id or null. */
export type ImportImage = (url: string) => Promise<string | null>;

const cut = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

function matchVendor(name: string | undefined, vendors: EditorLookups["vendors"]): string | undefined {
  if (!name) return undefined;
  const n = norm(name);
  return (vendors.find(v => norm(v.name) === n) ?? vendors.find(v => n.includes(norm(v.name)) || norm(v.name).includes(n)))?._id;
}

export function programPrefillGroups(p: PrefillProgram, form: ProgramForm, lookups: EditorLookups): PrefillGroupInfo<ProgramPrefillGroup>[] {
  const vendorId = matchVendor(p.vendor, lookups.vendors);
  const cats = (p.categories ?? []).filter(c => lookups.categories.some(x => norm(x.title) === norm(c)));
  const identity = [
    p.title && `Title "${p.title}"`,
    p.vendor && (vendorId ? `vendor ${p.vendor}` : `vendor "${p.vendor}" (not found, add it in Vendors)`),
    cats.length && `categories ${cats.join(", ")}`,
    p.platforms?.length && p.platforms.join(" + ")
  ].filter(Boolean);
  return [
    { id: "identity", label: "Title, vendor, categories, platforms", preview: identity.length ? identity.join(" · ") : null, filled: !!form.title },
    {
      id: "version",
      label: "Version & tracking",
      preview: p.latestOfficialVersion || p.versionCheck ? [p.latestOfficialVersion && `v${p.latestOfficialVersion}`, p.versionCheck && `track via ${p.versionCheck.source}`].filter(Boolean).join(" · ") : null,
      filled: !!form.latestOfficialVersion
    },
    { id: "download", label: "Download link", preview: p.downloadLink ? cut(p.downloadLink) : null, filled: !!form.downloadLink },
    { id: "description", label: "Description", preview: p.description ? cut(p.description) : null, filled: !!form.description.md.trim() },
    {
      id: "about",
      label: "About sections",
      preview: p.aboutSections?.length ? `${p.aboutSections.length}: ${p.aboutSections.map(a => a.title || cut(a.description, 30)).join(" · ")}` : null,
      filled: form.about.length > 0
    },
    {
      id: "faq",
      label: "FAQ",
      preview: p.faq?.length ? `${p.faq.length} questions: ${cut(p.faq.map(f => f.question).join(" · "), 120)}` : null,
      filled: form.faq.length > 0
    },
    {
      id: "freeVsPro",
      label: "Free vs PRO",
      preview: p.freeVsPro?.length ? `${p.freeVsPro.length} rows: ${p.freeVsPro.map(r => r.feature).join(", ")}` : null,
      filled: form.freeVsPro.length > 0
    },
    {
      id: "seo",
      label: "SEO",
      preview: p.seo ? cut([p.seo.metaTitle, p.seo.metaDescription].filter(Boolean).join(" — "), 120) || null : null,
      filled: !!(form.metaTitle || form.metaDescription)
    },
    { id: "aliases", label: "Giveaway aliases (merged)", preview: p.aliases?.length ? p.aliases.join(", ") : null, filled: false },
    { id: "image", label: "Program image", preview: p.imageUrl ? cut(p.imageUrl) : null, filled: !!form.image.assetId }
  ];
}

export async function applyProgramPrefill(
  form: ProgramForm,
  p: PrefillProgram,
  groups: Set<ProgramPrefillGroup>,
  lookups: EditorLookups,
  importImage: ImportImage
): Promise<ProgramForm> {
  const next: ProgramForm = { ...form };
  const rt = (md: string) => ({ ...emptyRichText(md) });

  if (groups.has("identity")) {
    if (p.title) next.title = p.title;
    const vendorId = matchVendor(p.vendor, lookups.vendors);
    if (vendorId) next.vendorId = vendorId;
    const catIds = (p.categories ?? [])
      .map(c => lookups.categories.find(x => norm(x.title) === norm(c))?._id)
      .filter((id): id is string => !!id);
    if (catIds.length) next.categories = catIds.map(_ref => form.categories.find(c => c._ref === _ref) ?? { _key: newKey(), _ref });
    if (p.platforms?.length) next.platforms = p.platforms;
  }
  if (groups.has("version")) {
    if (p.latestOfficialVersion) next.latestOfficialVersion = p.latestOfficialVersion;
    if (p.versionCheck && !form.versionSource) {
      next.versionSource = p.versionCheck.source;
      next.versionPageUrl = p.versionCheck.pageUrl ?? "";
      next.versionInstallerUrl = p.versionCheck.installerUrl ?? "";
      next.versionPackageId = p.versionCheck.packageId ?? "";
    }
  }
  if (groups.has("download") && p.downloadLink) next.downloadLink = p.downloadLink;
  if (groups.has("description") && p.description) next.description = { ...form.description, md: p.description };

  if (groups.has("about") && p.aboutSections?.length) {
    // Keep images and icons already set at the same positions.
    next.about = await Promise.all(
      p.aboutSections.slice(0, 4).map(async (a, i) => {
        const old = form.about[i];
        const imported = !old?.image.assetId && a.imageUrl ? await importImage(a.imageUrl) : null;
        return {
          _key: old?._key ?? newKey(),
          sectionTitle: a.title ?? "",
          description: old ? { ...old.description, md: a.description } : rt(a.description),
          image: imported ? { assetId: imported } : (old?.image ?? { assetId: null }),
          invertDesktop: old?.invertDesktop ?? i % 2 === 1,
          invertMobile: old?.invertMobile ?? false,
          points: (a.points ?? []).map((text, j) => {
            const oldPoint = old?.points[j];
            return { _key: oldPoint?._key ?? newKey(), text: oldPoint ? { ...oldPoint.text, md: text } : rt(text), icon: oldPoint?.icon ?? { assetId: null } };
          })
        };
      })
    );
  }
  if (groups.has("faq") && p.faq?.length) {
    next.faq = p.faq.map((f, i) => {
      const old = form.faq[i];
      return { _key: old?._key ?? newKey(), question: f.question, answer: old ? { ...old.answer, md: f.answer } : rt(f.answer) };
    });
  }
  if (groups.has("freeVsPro") && p.freeVsPro?.length) {
    next.freeVsPro = p.freeVsPro.map((r, i) => ({ _key: form.freeVsPro[i]?._key ?? newKey(), feature: r.feature, free: r.free ?? "", pro: r.pro ?? "" }));
  }
  if (groups.has("seo") && p.seo) {
    if (p.seo.metaTitle) next.metaTitle = p.seo.metaTitle;
    if (p.seo.metaDescription) next.metaDescription = p.seo.metaDescription;
    if (p.seo.metaKeywords?.length) next.metaKeywords = p.seo.metaKeywords;
  }
  if (groups.has("aliases") && p.aliases?.length) {
    next.aliases = [...new Set([...form.aliases, ...p.aliases])];
  }
  if (groups.has("image") && p.imageUrl) {
    const assetId = await importImage(p.imageUrl);
    if (assetId) next.image = { assetId };
  }
  return next;
}

export function vendorPrefillGroups(v: PrefillVendor, form: VendorForm): PrefillGroupInfo<VendorPrefillGroup>[] {
  return [
    { id: "identity", label: "Name", preview: v.name ?? null, filled: !!form.name },
    { id: "description", label: "Description", preview: v.description ? cut(v.description) : null, filled: !!form.description.md.trim() },
    { id: "aliases", label: "Aliases (merged)", preview: v.aliases?.length ? v.aliases.join(", ") : null, filled: false },
    {
      id: "comparison",
      label: "Giveaway vs Official PRO",
      preview: v.giveawayVsOfficial?.length ? `${v.giveawayVsOfficial.length} rows: ${v.giveawayVsOfficial.map(r => r.feature).join(", ")}` : null,
      filled: form.comparison.length > 0
    },
    { id: "seo", label: "SEO", preview: v.seo ? cut([v.seo.metaTitle, v.seo.metaDescription].filter(Boolean).join(" — "), 120) || null : null, filled: !!(form.metaTitle || form.metaDescription) },
    { id: "logo", label: "Logo", preview: v.logoUrl ? cut(v.logoUrl) : null, filled: !!form.logo.assetId }
  ];
}

export async function applyVendorPrefill(form: VendorForm, v: PrefillVendor, groups: Set<VendorPrefillGroup>, importImage: ImportImage): Promise<VendorForm> {
  const next: VendorForm = { ...form };
  if (groups.has("identity") && v.name) next.name = v.name;
  if (groups.has("description") && v.description) next.description = { ...form.description, md: v.description };
  if (groups.has("aliases") && v.aliases?.length) next.aliases = [...new Set([...form.aliases, ...v.aliases])];
  if (groups.has("comparison") && v.giveawayVsOfficial?.length) {
    next.comparison = v.giveawayVsOfficial.map((r, i) => ({
      _key: form.comparison[i]?._key ?? newKey(),
      feature: r.feature,
      giveaway: r.giveaway ?? "",
      officialPro: r.officialPro ?? ""
    }));
  }
  if (groups.has("seo") && v.seo) {
    if (v.seo.metaTitle) next.metaTitle = v.seo.metaTitle;
    if (v.seo.metaDescription) next.metaDescription = v.seo.metaDescription;
  }
  if (groups.has("logo") && v.logoUrl) {
    const assetId = await importImage(v.logoUrl);
    if (assetId) next.logo = { assetId };
  }
  return next;
}

/** Content already in the program editor, in prefill shape (lets the AI improve instead of starting over). */
export function programFormToPrefill(f: ProgramForm): PrefillProgram {
  return {
    title: f.title || undefined,
    latestOfficialVersion: f.latestOfficialVersion || undefined,
    description: f.description.md || undefined,
    aboutSections: f.about.length
      ? f.about.map(a => ({ title: a.sectionTitle || undefined, description: a.description.md, points: a.points.map(p => p.text.md) }))
      : undefined,
    faq: f.faq.length ? f.faq.map(q => ({ question: q.question, answer: q.answer.md })) : undefined,
    freeVsPro: f.freeVsPro.length ? f.freeVsPro.map(r => ({ feature: r.feature, free: r.free, pro: r.pro })) : undefined,
    seo: f.metaTitle || f.metaDescription ? { metaTitle: f.metaTitle || undefined, metaDescription: f.metaDescription || undefined } : undefined,
    aliases: f.aliases.length ? f.aliases : undefined
  };
}

export function vendorFormToPrefill(f: VendorForm): PrefillVendor {
  return {
    name: f.name || undefined,
    description: f.description.md || undefined,
    aliases: f.aliases.length ? f.aliases : undefined,
    giveawayVsOfficial: f.comparison.length ? f.comparison.map(r => ({ feature: r.feature, giveaway: r.giveaway, officialPro: r.officialPro })) : undefined,
    seo: f.metaTitle || f.metaDescription ? { metaTitle: f.metaTitle || undefined, metaDescription: f.metaDescription || undefined } : undefined
  };
}
