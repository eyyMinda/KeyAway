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

export async function generateHomePageMetadata(): Promise<Metadata> {
  const storeData = await getStoreData();
  const storeTitle = storeData?.title || "KeyAway";

  return {
    title: `${storeTitle} - Free Giveaway CD Keys`,
    description:
      "Get free CD keys for popular software and games. Download programs with working license keys from our giveaway collection.",
    openGraph: {
      title: `${storeTitle} - Free Giveaway CD Keys`,
      description:
        "Get free CD keys for popular software and games. Download programs with working license keys from our giveaway collection.",
      type: "website",
      url: "https://keyaway.com"
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeTitle} - Free Giveaway CD Keys`,
      description:
        "Get free CD keys for popular software and games. Download programs with working license keys from our giveaway collection."
    },
    alternates: {
      canonical: "https://keyaway.com"
    }
  };
}

export async function generateProgramMetadata(slug: string): Promise<Metadata> {
  try {
    const [program, storeData] = await Promise.all([getProgramWithUpdatedKeys(slug), getStoreData()]);

    const storeTitle = storeData?.title || "KeyAway";

    if (!program) {
      return {
        title: `Program Not Found - ${storeTitle}`,
        description: "The requested program could not be found."
      };
    }

    const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);
    const workingKeys = sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length;
    const totalKeys = sortedCdKeys.length;

    const title = `${program.title} - Free CD Keys | ${storeTitle}`;
    const description = `${program.description} Get ${workingKeys} working CD keys out of ${totalKeys} total. Download ${program.title} for free with our giveaway keys.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        url: `https://keyaway.com/program/${slug}`,
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
        canonical: `https://keyaway.com/program/${slug}`
      }
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Program - KeyAway",
      description: "Free Giveaway CD Keys"
    };
  }
}
