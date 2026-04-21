import { Metadata } from "next";
import { CDKey } from "@/src/types";
import { urlFor } from "@/src/sanity/lib/image";
import { sortCdKeysByStatus } from "@/src/lib/program/cdKeyUtils";
import { formatProgramSeoName, getHighestKeyVersion } from "@/src/lib/program/versionSummary";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanity/sanityActions";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "@/src/lib/sanity/queries";
import {
  DEFAULT_STORE_NAME,
  resolveHomePageSeo,
  resolvePrivacyPageSeo,
  resolveProgramsPageSeo,
  resolveSiteBaseUrl,
  resolveTermsPageSeo
} from "@/src/lib/seo/storeSeoResolve";

async function getStoreData() {
  return (
    (await client.fetch(storeDetailsQuery))[0] || {
      title: DEFAULT_STORE_NAME,
      description: "Free Giveaway CD Keys",
      header: { isLogo: false, headerLinks: [] },
      footer: { isLogo: false, footerLinks: [] },
      socialLinks: [],
      programCount: 0
    }
  );
}

const defaultData = {
  store: DEFAULT_STORE_NAME,
  description:
    "Get free CD keys for popular software like IOBIT, iTop and more. Download premium programs with working activation keys from our giveaway collection.",
  programTitle: (displayName: string, storeTitle: string) =>
    `${displayName}: free CD keys & giveaway activation | ${storeTitle}`,
  programDescription: (programTitle: string, workingKeys: number, totalKeys: number) =>
    `Free ${programTitle} giveaway CD keys for Windows. ${workingKeys} working keys out of ${totalKeys} — copy a license and activate in-app. Official download recommended.`
};

export async function generateHomePageMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const { title, description, siteUrl, ogImageUrl, storeTitle } = resolveHomePageSeo(storeData);

  return {
    title,
    description,
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
    const [program, storeData] = await Promise.all([getProgramWithUpdatedKeys(slug), getStoreData()]);
    const storeTitle = storeData?.title || defaultData.store;

    if (!program) {
      return {
        title: `Program Not Found - ${storeTitle}`,
        description: "The requested program could not be found."
      };
    }

    const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);
    const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;
    const totalKeys = sortedCdKeys.length;

    const highestKeyVersion = getHighestKeyVersion(sortedCdKeys);
    const displayName = formatProgramSeoName(program, highestKeyVersion);

    const title = program.seo?.metaTitle?.trim() || defaultData.programTitle(displayName, storeTitle);
    const description =
      program.seo?.metaDescription?.trim() || defaultData.programDescription(program.title, workingKeys, totalKeys);
    const baseUrl = resolveSiteBaseUrl(storeData?.seo);
    const url = `${baseUrl}/program/${slug}`;

    return {
      title,
      description,
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
  const storeData = await getStoreData();
  const { title, description, pageUrl: url } = resolvePrivacyPageSeo(storeData);

  return {
    title,
    description,
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
  const storeData = await getStoreData();
  const { title, description, pageUrl: url } = resolveTermsPageSeo(storeData);

  return {
    title,
    description,
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
  const storeData = await getStoreData();
  const { title, description, pageUrl: url, ogImageUrl, storeTitle } = resolveProgramsPageSeo(storeData);

  return {
    title,
    description,
    keywords: [
      "free software",
      "license keys",
      "CD keys",
      "software programs",
      "premium software free",
      "all programs",
      "software collection"
    ],
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
