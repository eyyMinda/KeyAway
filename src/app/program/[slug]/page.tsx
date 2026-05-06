/** @fileoverview Program detail: keys, related programs, JSON-LD; visitor context for hero and spammer gate on reports. */
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
import { sortCdKeysByStatus } from "@/src/lib/program/cdKeyUtils";
import {
  formatVersionSummaryLine,
  getCdKeyTableIntroVendorRelease,
  getCdKeyTableIntroVersionConfirmation,
  getHighestKeyVersion
} from "@/src/lib/program/versionSummary";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanity/sanityActions";
import { client } from "@/src/sanity/lib/client";
import { popularProgramsQuery } from "@/src/lib/sanity/queries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { generateProgramMetadata } from "@/src/lib/seo/metadata";
import { generateProgramPageJsonLd } from "@/src/lib/seo/jsonLd";
import JsonLd from "@/src/components/JsonLd";
import { headers } from "next/headers";
import { getVisitorContextForPublicPage } from "@/src/lib/visitors/serverVisitorContext";
import { portableTextHasContent } from "@/src/lib/portableText/toPlainText";
import type { Program, ProgramFaqItem } from "@/src/types/program";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";
import { getRowStorageHash } from "@/src/lib/keyHashing";
import I18nShell from "@/src/components/i18n/I18nShell";
import { loadMessages } from "@/src/lib/i18n/loadMessages";
import { TAG_PROGRAM_LISTINGS, TAG_SITEMAP_URLS } from "@/src/lib/cache/cacheTags";

/** Keep in sync with `PUBLIC_ISR_REVALIDATE_SECONDS`. */
export const revalidate = 120;

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await client.fetch<Array<{ slug?: { current?: string } }>>(
    `*[_type == "program"] | order(coalesce(popularityScore, 0) desc) [0...25]{ slug }`,
    {},
    { next: { tags: [TAG_SITEMAP_URLS] } }
  );
  return (slugs ?? [])
    .map(item => item.slug?.current)
    .filter((value): value is string => Boolean(value))
    .map(slug => ({ slug }));
}

// Generate dynamic metadata for each program page
export async function generateMetadata({ params }: ProgramPageProps) {
  const { slug } = await params;
  return generateProgramMetadata(slug);
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;

  const program = await getProgramWithUpdatedKeys(slug);

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

  const [allPrograms, store] = await Promise.all([
    client.fetch(popularProgramsQuery, {}, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    getCachedStoreDetailsDocument()
  ]);

  const socialData: SocialData = {
    socialLinks: store?.socialLinks ?? []
  };

  const hdrs = await headers();
  const { isSpammer, visitorHint } = await getVisitorContextForPublicPage(hdrs);
  const relatedPrograms = (allPrograms as Program[])
    .filter(p => p.slug.current !== slug)
    .slice(0, 5)
    .map(p => ({ ...p, cdKeys: p.cdKeys ?? [] }));

  const faqItems =
    program.faq?.filter((f: ProgramFaqItem) => f.question?.trim() && portableTextHasContent(f.answer)) ?? [];

  const storeInfo = store || { title: "KeyAway" };
  const jsonLd = generateProgramPageJsonLd(program, workingKeys, totalKeys, storeInfo);
  const i18n = await loadMessages({ locale: "en", namespaces: ["common", "program"], programFlow });

  return (
    <>
      <JsonLd data={jsonLd} />
      <I18nShell locale={i18n.locale} messages={i18n.messages}>
        <main className="min-h-screen bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
          <ProgramInformation
            program={program}
            totalKeys={totalKeys}
            workingKeys={workingKeys}
            socialData={socialData}
            visitorHint={visitorHint}
          />
          <CDKeyTable
            cdKeys={sortedCdKeys}
            rowStorageIds={rowStorageIds}
            slug={slug}
            program={program}
            programTitle={program.title}
            isSpammerVisitor={isSpammer}
            vendorReleaseForIntro={vendorReleaseForIntro}
            introVersionConfirmation={introVersionConfirmation}
            versionSummaryLine={versionSummaryLine}
          />
          <ContributeBanner />
          <ProgramAboutSection program={program} />
          <ActivationInstructions programTitle={program.title} downloadLink={program.downloadLink} />
          <ProgramFaqSection programTitle={program.title} items={faqItems} />
          <RelatedPrograms programs={relatedPrograms} />
          <CommentsSection />
        </main>
      </I18nShell>
    </>
  );
}
