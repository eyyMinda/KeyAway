import { Metadata } from "next";
import { CDKey } from "@/src/types";
import { urlFor } from "@/src/sanity/lib/image";
import { sortCdKeysByStatus } from "./cdKeyUtils";
import { getProgramWithUpdatedKeys } from "./sanityActions";
import { client } from "@/src/sanity/lib/client";
import { storeDetailsQuery } from "./queries";

async function getStoreData() {
  return (
    (await client.fetch(storeDetailsQuery))[0] || {
      title: "KeyAway",
      description: "Free Giveaway CD Keys",
      header: { isLogo: false, headerLinks: [] },
      footer: { isLogo: false, footerLinks: [] }
    }
  );
}

const defaultData = {
  store: "KeyAway",
  title: (storeTitle: string) => `${storeTitle} - Free CD Keys for Premium Software`,
  description:
    "Get free CD keys for popular software like IOBIT, Malware Fighter, and more. Download premium programs with working activation keys from our giveaway collection.",
  url: "https://www.keyaway.app",
  image: "https://www.keyaway.app/images/KeyAway_Card.png",
  programTitle: (programTitle: string, storeTitle: string) =>
    `${programTitle} Premium Software Free CD Keys | ${storeTitle}`,
  programDescription: (programTitle: string, workingKeys: number, totalKeys: number) =>
    `Download ${programTitle} for free! Get ${workingKeys} working CD keys out of ${totalKeys} total. Premium software activation keys from our giveaway collection.`,
  programUrl: (slug: string) => `${defaultData.url}/program/${slug}`,
  privacyTitle: (storeTitle: string) => `Privacy Policy | ${storeTitle}`,
  privacyDescription: (storeTitle: string) =>
    `Learn how ${storeTitle} handles your personal data, comments, and contributions while keeping the site transparent.`,
  termsTitle: (storeTitle: string) => `Terms of Service | ${storeTitle}`,
  termsDescription: (storeTitle: string) =>
    `Read the terms of service for using ${storeTitle}, a platform for sharing publicly available giveaway CD keys.`
};

export async function generateHomePageMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const storeTitle = storeData?.title || defaultData.store;

  const title = defaultData.title(storeTitle);
  const description = storeData?.description || defaultData.description;
  const url = defaultData.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [
        {
          url: defaultData.image,
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
      images: [defaultData.image]
    },
    alternates: {
      canonical: url
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

    const title = defaultData.programTitle(program.title, storeTitle);
    const description = defaultData.programDescription(program.title, workingKeys, totalKeys);
    const url = defaultData.programUrl(slug);

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
      title: defaultData.title(defaultData.store),
      description: defaultData.description
    };
  }
}

export async function generatePrivacyMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const storeTitle = storeData?.title || defaultData.store;

  const title = defaultData.privacyTitle(storeTitle);
  const description = defaultData.privacyDescription(storeTitle);
  const url = `${defaultData.url}/privacy`;

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
  const storeTitle = storeData?.title || defaultData.store;

  const title = defaultData.termsTitle(storeTitle);
  const description = defaultData.termsDescription(storeTitle);
  const url = `${defaultData.url}/terms`;

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

export function generateProgramsPageMetadata() {
  const storeTitle = "KeyAway";

  const defaultProgramsData = {
    title: (title: string) => `All Programs - ${title}`,
    description: (title: string) =>
      `Browse all software programs with free CD keys on ${title}. Find premium software for free with verified, working activation keys.`,
    url: `${defaultData.url}/programs`
  };

  const title = defaultProgramsData.title(storeTitle);
  const description = defaultProgramsData.description(storeTitle);
  const url = defaultProgramsData.url;

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
          url: defaultData.image,
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
      images: [defaultData.image]
    },
    alternates: {
      canonical: defaultProgramsData.url
    }
  };
}
