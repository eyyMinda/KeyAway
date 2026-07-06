import { Program } from "@/src/types";
import { getKeyData } from "@/src/lib/keyHashing";
import {
  getActivationEntryIdentityString,
  normalizeProgramFlow
} from "@/src/lib/program/activationEntry";
import { programT } from "@/src/lib/program/programCopy";
import { portableTextHasContent, portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { urlFor } from "@/src/sanity/lib/image";
import { cdKeyHasExpiry } from "@/src/lib/program/cdKeyUtils";
import { buildSoftwareApplicationDescription, getSoftwareVersionForSchema } from "@/src/lib/program/versionSummary";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";
import type { StoreSeo } from "@/src/types/layout";

const BASE_URL = "https://www.keyaway.app";

type JsonLdData = Record<string, unknown>;

export function generateHomePageJsonLd(storeData: {
  title: string;
  description: string;
  siteUrl?: string;
}) {
  const base = (storeData.siteUrl || BASE_URL).replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeData.title || "KeyAway",
    description: storeData.description || "Free CD Keys for Premium Software",
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/programs?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: storeData.title || "KeyAway",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/images/KeyAway_Icon_White.png`,
        width: 400,
        height: 400
      }
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Free Software Programs",
      description: "Collection of premium software programs with free CD keys",
      url: `${base}/programs`
    }
  };
}

// JSON-LD for Programs Page - CollectionPage schema
export function generateProgramsPageJsonLd(programs: Program[], totalCount: number, siteBaseUrl?: string) {
  const base = (siteBaseUrl || BASE_URL).replace(/\/$/, "");
  const programItems = programs.slice(0, 20).map(program => ({
    "@type": "SoftwareApplication",
    name: program.title,
    description: portableTextToPlainText(program.description),
    url: `${base}/program/${program.slug.current}`,
    image: program.image ? urlFor(program.image).width(400).height(400).url() : undefined,
    applicationCategory: "SoftwareApplication",
    operatingSystem: "Windows",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: "Free CD Key"
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "All Software Programs",
    description: `Browse our complete collection of ${totalCount} software programs with verified CD keys`,
    url: `${base}/programs`,
    mainEntity: {
      "@type": "ItemList",
      name: "Software Programs Collection",
      description: "Free software programs with CD keys",
      numberOfItems: totalCount,
      itemListElement: programItems.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: item
      }))
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: base
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Programs",
          item: `${base}/programs`
        }
      ]
    }
  };
}

// JSON-LD for Individual Program Page - SoftwareApplication schema (+ optional FAQPage)
export function generateProgramPageJsonLd(
  program: Program,
  _workingKeys: number,
  _totalKeys: number,
  storeData: { title: string; seo?: StoreSeo },
  rating?: { ratingValue: number; ratingCount: number } | null
) {
  const base = resolveSiteBaseUrl(storeData.seo).replace(/\/$/, "");
  // Prefer the linked vendor brand; fall back to the first word of the title for legacy docs.
  const brand = program.vendor?.name || program.title.match(/^([A-Za-z]+)/)?.[1] || "Unknown";

  const pageUrl = `${base}/program/${program.slug.current}`;
  const appDescription = buildSoftwareApplicationDescription(program);
  const softwareVersion = getSoftwareVersionForSchema(program, program.cdKeys);
  const flow = normalizeProgramFlow(program.programFlow);
  const offerDesc = programT(flow, "jsonld.offerDescription", { programTitle: program.title });
  const offerDescGeneric = programT(flow, "jsonld.offerDescriptionGeneric", { programTitle: program.title });

  const offers = program.cdKeys
    .filter(cdKey => cdKey.status === "active" || cdKey.status === "new")
    .slice(0, 10)
    .map((cdKey, idx) => {
      const identity = getActivationEntryIdentityString(cdKey, flow);
      const kd = getKeyData({ ...cdKey, programFlow: flow }, flow);
      const skuTail = kd?.hash?.slice(0, 12) ?? `row-${idx}`;
      return {
        "@type": "Offer",
        sku: `activation-${skuTail}`,
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: identity ? offerDesc : offerDescGeneric,
        itemCondition: "https://schema.org/NewCondition",
        ...(cdKey.validFrom ? { validFrom: cdKey.validFrom } : {}),
        ...(cdKeyHasExpiry(cdKey.validUntil) ? { validThrough: cdKey.validUntil } : {})
      };
    });

  const softwareApp: JsonLdData = {
    "@type": "SoftwareApplication",
    name: program.title,
    description: appDescription,
    url: pageUrl,
    applicationCategory: "SoftwareApplication",
    operatingSystem: "Windows",
    datePublished: program._updatedAt || new Date().toISOString(),
    dateModified: program._updatedAt || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: brand
    },
    publisher: {
      "@type": "Organization",
      name: storeData.title || "KeyAway",
      url: base,
      logo: {
        "@type": "ImageObject",
        url: `${base}/images/KeyAway_Icon_White.png`,
        width: 400,
        height: 400
      }
    },
    offers:
      offers.length > 0
        ? offers
        : {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            description: offerDescGeneric
          },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Programs", item: `${base}/programs` },
        ...(program.vendor
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: program.vendor.name,
                item: `${base}/vendors/${program.vendor.slug}`
              }
            ]
          : []),
        {
          "@type": "ListItem",
          position: program.vendor ? 4 : 3,
          name: program.title,
          item: pageUrl
        }
      ]
    }
  };

  if (softwareVersion) {
    softwareApp.softwareVersion = softwareVersion;
  }

  if (rating && rating.ratingCount > 0) {
    softwareApp.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(rating.ratingValue),
      ratingCount: rating.ratingCount,
      bestRating: "5",
      worstRating: "1"
    };
  }

  // Add image if available
  if (program.image) {
    softwareApp.image = {
      "@type": "ImageObject",
      url: urlFor(program.image).width(800).height(600).url(),
      name: program.title,
      width: 800,
      height: 600
    };
  }

  // Add download link if available
  if (program.downloadLink) {
    softwareApp.downloadUrl = program.downloadLink;
  }

  const faq =
    program.faq?.filter(f => f.question?.trim() && portableTextHasContent(f.answer)) ?? [];
  if (faq.length >= 2) {
    const faqPage: JsonLdData = {
      "@type": "FAQPage",
      url: `${pageUrl}#faq`,
      mainEntity: faq.map(f => ({
        "@type": "Question",
        name: f.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: portableTextToPlainText(f.answer)
        }
      }))
    };
    return {
      "@context": "https://schema.org",
      "@graph": [softwareApp, faqPage]
    };
  }

  return {
    "@context": "https://schema.org",
    ...softwareApp
  };
}

interface VendorLd {
  name: string;
  slug: string;
  programCount?: number;
}

// JSON-LD for /vendors index — CollectionPage listing every vendor hub.
export function generateVendorsPageJsonLd(
  vendors: VendorLd[],
  siteBaseUrl?: string
) {
  const base = (siteBaseUrl || BASE_URL).replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Software Vendors",
    description: "Browse software publishers with free promotional CD keys and giveaways.",
    url: `${base}/vendors`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: vendors.length,
      itemListElement: vendors.map((v, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: v.name,
        item: `${base}/vendors/${v.slug}`
      }))
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Vendors", item: `${base}/vendors` }
      ]
    }
  };
}

// JSON-LD for /vendors/{slug} hub — CollectionPage of the vendor's programs.
export function generateVendorPageJsonLd(
  vendor: { name: string; slug: string; description?: string },
  programs: Program[],
  siteBaseUrl?: string
) {
  const base = (siteBaseUrl || BASE_URL).replace(/\/$/, "");
  const vendorUrl = `${base}/vendors/${vendor.slug}`;
  const items = programs.slice(0, 30).map((program, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "SoftwareApplication",
      name: program.title,
      url: `${base}/program/${program.slug.current}`,
      image: program.image ? urlFor(program.image).width(400).height(400).url() : undefined,
      applicationCategory: "SoftwareApplication",
      operatingSystem: "Windows",
      author: { "@type": "Organization", name: vendor.name },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "Free CD Key"
      }
    }
  }));

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${vendor.name} — Free CD Keys & Giveaways`,
    description:
      vendor.description || `Free promotional CD keys and giveaways for ${vendor.name} software.`,
    url: vendorUrl,
    about: { "@type": "Organization", name: vendor.name },
    mainEntity: {
      "@type": "ItemList",
      name: `${vendor.name} programs`,
      numberOfItems: programs.length,
      itemListElement: items
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Vendors", item: `${base}/vendors` },
        { "@type": "ListItem", position: 3, name: vendor.name, item: vendorUrl }
      ]
    }
  };
}

// Utility function to safely stringify JSON-LD
export function stringifyJsonLd(jsonLd: JsonLdData): string {
  try {
    return JSON.stringify(jsonLd, null, 0);
  } catch (error) {
    console.error("Error stringifying JSON-LD:", error);
    return "{}";
  }
}
