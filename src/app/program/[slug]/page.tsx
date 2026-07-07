/** @fileoverview Program detail: keys, related programs, JSON-LD; visitor context via client fetch. */
import { CDKey, SocialData } from "@/src/types";
import { notFound } from "next/navigation";
import ProgramInformation from "@/src/components/program/ProgramInformation";
import ProgramAboutSection from "@/src/components/program/ProgramAboutSection";
import ProgramFaqSection from "@/src/components/program/ProgramFaqSection";
import CDKeyTable from "@/src/components/program/cdkeys/CDKeyTable";
import ContributeBanner from "@/src/components/program/ContributeBanner";
import ActivationInstructions from "@/src/components/program/ActivationInstructions";
import RelatedPrograms from "@/src/components/program/RelatedPrograms";
import CommentsSection from "@/src/components/program/comments/CommentsSection";
import AffiliateProCta from "@/src/components/program/AffiliateProCta";
import FreeVsProComparison from "@/src/components/program/FreeVsProComparison";
import KeySourcePanel from "@/src/components/program/KeySourcePanel";
import { sortCdKeysByStatus } from "@/src/lib/program/cdKeyUtils";
import {
  formatVersionSummaryLine,
  getCdKeyTableIntroVendorRelease,
  getCdKeyTableIntroVersionConfirmation,
  getHighestKeyVersion
} from "@/src/lib/program/versionSummary";
import { getProgramBySlug } from "@/src/lib/sanity/sanityActions";
import { getCachedRelatedPrograms } from "@/src/lib/sanity/getCachedRelatedPrograms";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getProgramAggregateRating } from "@/src/lib/program/programAggregateRating";
import { generateProgramMetadata } from "@/src/lib/seo/metadata";
import { generateProgramPageJsonLd } from "@/src/lib/seo/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import ProgramBreadcrumbs from "@/src/components/program/ProgramBreadcrumbs";
import ProgramSocialShare from "@/src/components/program/social-share/ProgramSocialShare";
import { getProgramShareCounts } from "@/src/lib/program/getProgramShareCounts";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import { urlFor } from "@/src/sanity/lib/image";
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import type { Program, ProgramFaqItem } from "@/src/types/program";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import { getRowStorageHash } from "@/src/lib/keyHashing";
import I18nShell from "@/src/components/i18n/I18nShell";
import { loadMessages } from "@/src/lib/i18n/loadMessages";
import { ProgramVisitorProvider } from "@/src/components/visitors/ProgramVisitorProvider";
import { client } from "@/src/sanity/lib/client";
import { TAG_SITEMAP_URLS } from "@/src/lib/cache/cacheTags";
/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` in `@/src/lib/cache/constants` (Next.js requires a literal). */
export const revalidate = 43200;

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await client.fetch<Array<{ slug?: { current?: string } }>>(
    `*[_type == "program"] | order(coalesce(stats.popularityScore, popularityScore, 0) desc) [0...50]{ slug }`,
    {},
    { next: { tags: [TAG_SITEMAP_URLS] } }
  );
  return (slugs ?? [])
    .map(item => item.slug?.current)
    .filter((value): value is string => Boolean(value))
    .map(slug => ({ slug }));
}

export async function generateMetadata({ params }: ProgramPageProps) {
  const { slug } = await params;
  return generateProgramMetadata(slug);
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;

  const program = await getProgramBySlug(slug);

  if (!program) return notFound();

  const programFlow = normalizeProgramFlow(program.programFlow);
  const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);
  const rowStorageIds = sortedCdKeys.map(k => getRowStorageHash(k, programFlow));

  const totalKeys = sortedCdKeys.length;
  const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;
  const highestKeyVersion = getHighestKeyVersion(sortedCdKeys);
  const vendorReleaseForIntro = getCdKeyTableIntroVendorRelease(program, highestKeyVersion);
  const introVersionConfirmation = getCdKeyTableIntroVersionConfirmation(program, highestKeyVersion);
  const versionSummaryLine = formatVersionSummaryLine(program, highestKeyVersion);

  const [allPrograms, store, communityRating, shareCounts] = await Promise.all([
    getCachedRelatedPrograms(),
    getCachedStoreDetailsDocument(),
    getProgramAggregateRating(slug),
    getProgramShareCounts(slug)
  ]);

  const pageUrl = `${resolveSiteBaseUrl(store?.seo)}/program/${slug}`;
  const shareImageUrl = program.image ? urlFor(program.image).width(1200).height(630).url() : undefined;

  const socialData: SocialData = {
    socialLinks: store?.socialLinks ?? []
  };

  const relatedPrograms = allPrograms
    .filter(p => p.slug.current !== slug)
    .slice(0, 5)
    .map(p => ({ ...p, cdKeys: p.cdKeys ?? [] }));

  const faqItems =
    program.faq?.filter((f: ProgramFaqItem) => f.question?.trim() && portableTextHasContent(f.answer)) ?? [];

  const storeInfo = store || { title: "KeyAway" };
  const jsonLd = generateProgramPageJsonLd(program, workingKeys, totalKeys, storeInfo, communityRating);
  const i18n = await loadMessages({ locale: "en", namespaces: ["common", "program"], programFlow });

  return (
    <>
      <JsonLd data={jsonLd} />
      <I18nShell locale={i18n.locale} messages={i18n.messages}>
        <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:max-w-360 lg:px-8">
          <ProgramBreadcrumbs program={program} />
        </div>
        <ProgramVisitorProvider>
          <ProgramInformation
            program={program}
            totalKeys={totalKeys}
            workingKeys={workingKeys}
            socialData={socialData}
            communityRating={communityRating}
          />
          <ProgramSocialShare
            programTitle={program.title}
            programSlug={slug}
            pageUrl={pageUrl}
            workingKeys={workingKeys}
            imageUrl={shareImageUrl}
            shareCounts={shareCounts}
          />
          <CDKeyTable
            cdKeys={sortedCdKeys}
            rowStorageIds={rowStorageIds}
            slug={slug}
            program={program}
            programTitle={program.title}
            vendorReleaseForIntro={vendorReleaseForIntro}
            introVersionConfirmation={introVersionConfirmation}
            versionSummaryLine={versionSummaryLine}
          />
          <KeySourcePanel program={program} totalKeys={totalKeys} />
          <FreeVsProComparison program={program} />
          <AffiliateProCta program={program} />
        </ProgramVisitorProvider>
        <ActivationInstructions programTitle={program.title} downloadLink={program.downloadLink} />
        <ProgramAboutSection program={program} />
        <ContributeBanner />
        <ProgramFaqSection programTitle={program.title} items={faqItems} />
        <RelatedPrograms programs={relatedPrograms} />
        <CommentsSection program={program} />
      </I18nShell>
    </>
  );
}
