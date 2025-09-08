import { Metadata } from "next";
import { CDKey } from "@/src/types/ProgramType";
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
  title: (storeTitle: string) => `${storeTitle} - Free Giveaway CD Keys`,
  description:
    "Get free CD keys for popular software and games. Download programs with working license keys from our giveaway collection.",
  url: "https://keyaway.vercel.app",
  canonical: "https://keyaway.vercel.app",
  programTitle: (programTitle: string, storeTitle: string) => `${programTitle} - Free CD Keys | ${storeTitle}`,
  programDescription: (programTitle: string, workingKeys: number, totalKeys: number) =>
    `${programTitle} Get ${workingKeys} working CD keys out of ${totalKeys} total. Download ${programTitle} for free with our giveaway keys.`,
  programUrl: (slug: string) => `https://keyaway.vercel.app/program/${slug}`,
  programCanonical: (slug: string) => `https://keyaway.vercel.app/program/${slug}`
};

export async function generateHomePageMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const storeTitle = storeData?.title || defaultData.store;

  return {
    title: defaultData.title(storeTitle),
    description: defaultData.description,
    openGraph: {
      title: defaultData.title(storeTitle),
      description: defaultData.description,
      type: "website",
      url: defaultData.url
    },
    twitter: {
      card: "summary_large_image",
      title: defaultData.title(storeTitle),
      description: defaultData.description
    },
    alternates: {
      canonical: defaultData.canonical
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

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: defaultData.programUrl(slug),
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
        canonical: defaultData.programCanonical(slug)
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
