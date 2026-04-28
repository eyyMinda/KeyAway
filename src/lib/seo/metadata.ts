import { Metadata } from "next";
import { urlFor } from "@/src/sanity/lib/image";
import { client } from "@/src/sanity/lib/client";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import {
  DEFAULT_STORE_NAME,
  buildStoreSeoVariableMap,
  resolveHomePageSeo,
  resolveMetaKeywordList,
  resolvePrivacyPageSeo,
  resolveProgramsPageSeo,
  resolveSiteBaseUrl,
  resolveTermsPageSeo
} from "@/src/lib/seo/storeSeoResolve";
import { programT } from "@/src/lib/program/programCopy";
import { normalizeProgramFlow } from "@/src/lib/program/activationEntry";

const defaultData = {
  store: DEFAULT_STORE_NAME,
  description:
    "Get free CD keys for popular software like IOBIT, iTop and more. Download premium programs with working activation keys from our giveaway collection.",
  programTitle: (displayName: string, storeTitle: string) =>
    `${displayName}: free CD keys & giveaway activation | ${storeTitle}`,
  programDescription: (programTitle: string, workingKeys: number, totalKeys: number) =>
    `Free ${programTitle} giveaway CD keys for Windows. ${workingKeys} working keys out of ${totalKeys} — copy a license and activate in-app. Official download recommended.`
};

const defaultProgramsKeywords = [
  "free software",
  "license keys",
  "CD keys",
  "software programs",
  "premium software free",
  "all programs",
  "software collection"
];

export async function generateHomePageMetadata(): Promise<Metadata> {
  const storeData = await getCachedStoreDetailsDocument();
  const { title, description, siteUrl, ogImageUrl, storeTitle, keywords } = resolveHomePageSeo(storeData);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      url: siteUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: storeTitle
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: siteUrl
    }
  };
}

export async function generateProgramMetadata(slug: string): Promise<Metadata> {
  try {
    const programMetadataQuery = `*[_type == "program" && slug.current == $slug][0]{
      title,
      slug,
      seo,
      image,
      "programFlow": coalesce(programFlow, "cd_key"),
      "workingKeys": count(cdKeys[status == "active" || status == "new"]),
      "totalKeys": count(cdKeys[])
    }`;
    const [program, storeData] = await Promise.all([
      client.fetch(programMetadataQuery, { slug }, { next: { tags: [`program-${slug}`] } }),
      getCachedStoreDetailsDocument()
    ]);
    const storeTitle = storeData?.title || defaultData.store;

    if (!program) {
      return {
        title: `Program Not Found - ${storeTitle}`,
        description: "The requested program could not be found."
      };
    }

    const title = program.seo?.metaTitle?.trim() || defaultData.programTitle(program.title, storeTitle);
    const flow = normalizeProgramFlow(program.programFlow);
    const description =
      program.seo?.metaDescription?.trim() ||
      programT(flow, "seo.descriptionFallback", {
        programTitle: program.title,
        workingKeys: program.workingKeys ?? 0,
        totalKeys: program.totalKeys ?? 0
      });
    const baseUrl = resolveSiteBaseUrl(storeData?.seo);
    const url = `${baseUrl}/program/${slug}`;
    const programKeywords = resolveMetaKeywordList(program.seo?.metaKeywords, buildStoreSeoVariableMap(storeData));

    return {
      title,
      description,
      ...(programKeywords ? { keywords: programKeywords } : {}),
      openGraph: {
        title,
        description,
        type: "website",
        url,
        images: program.image
          ? [
              {
                url: urlFor(program.image).width(1200).height(630).url(),
                width: 1200,
                height: 630,
                alt: program.title
              }
            ]
          : []
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: program.image ? [urlFor(program.image).width(1200).height(630).url()] : []
      },
      alternates: {
        canonical: url
      }
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: `${DEFAULT_STORE_NAME} - Free CD Keys for Premium Software`,
      description: defaultData.description
    };
  }
}

export async function generatePrivacyMetadata(): Promise<Metadata> {
  const storeData = await getCachedStoreDetailsDocument();
  const { title, description, pageUrl: url, keywords } = resolvePrivacyPageSeo(storeData);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      url
    },
    twitter: {
      card: "summary",
      title,
      description
    },
    alternates: {
      canonical: url
    }
  };
}

export async function generateTermsMetadata(): Promise<Metadata> {
  const storeData = await getCachedStoreDetailsDocument();
  const { title, description, pageUrl: url, keywords } = resolveTermsPageSeo(storeData);

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      url
    },
    twitter: {
      card: "summary",
      title,
      description
    },
    alternates: {
      canonical: url
    }
  };
}

export async function generateProgramsPageMetadata(): Promise<Metadata> {
  const storeData = await getCachedStoreDetailsDocument();
  const { title, description, pageUrl: url, ogImageUrl, storeTitle, keywords } =
    resolveProgramsPageSeo(storeData);

  return {
    title,
    description,
    keywords: keywords ?? defaultProgramsKeywords,
    openGraph: {
      title,
      description,
      url,
      siteName: storeTitle,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${storeTitle} - All Programs`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: url
    }
  };
}
