import { Program } from "@/src/types";
import { urlFor } from "@/src/sanity/lib/image";
import { cdKeyHasExpiry } from "@/src/lib/program/cdKeyUtils";
import { buildSoftwareApplicationDescription, getSoftwareVersionForSchema } from "@/src/lib/program/versionSummary";

// Base URL for the site
const BASE_URL = "https://www.keyaway.app";

// Type for JSON-LD data
type JsonLdData = Record<string, unknown>;

// JSON-LD for Homepage - WebSite schema
export function generateHomePageJsonLd(storeData: { title: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeData.title || "KeyAway",
    description: storeData.description || "Free CD Keys for Premium Software",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/programs?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: storeData.title || "KeyAway",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/KeyAway_Logo.png`,
        width: 400,
        height: 400
      }
    },
    mainEntity: {
      "@type": "ItemList",
      name: "Free Software Programs",
      description: "Collection of premium software programs with free CD keys",
      url: `${BASE_URL}/programs`
    }
  };
}

// JSON-LD for Programs Page - CollectionPage schema
export function generateProgramsPageJsonLd(programs: Program[], totalCount: number) {
  const programItems = programs.slice(0, 20).map(program => ({
    "@type": "SoftwareApplication",
    name: program.title,
    description: program.description,
    url: `${BASE_URL}/program/${program.slug.current}`,
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
    url: `${BASE_URL}/programs`,
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
          item: BASE_URL
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Programs",
          item: `${BASE_URL}/programs`
        }
      ]
    }
  };
}

// JSON-LD for Individual Program Page - SoftwareApplication schema (+ optional FAQPage)
export function generateProgramPageJsonLd(
  program: Program,
  workingKeys: number,
  _totalKeys: number,
  storeData: { title: string }
) {
  // Extract brand from title (e.g., "IOBIT Malware Fighter" -> "IOBIT")
  const brandMatch = program.title.match(/^([A-Za-z]+)/);
  const brand = brandMatch ? brandMatch[1] : "Unknown";

  const pageUrl = `${BASE_URL}/program/${program.slug.current}`;
  const appDescription = buildSoftwareApplicationDescription(program);
  const softwareVersion = getSoftwareVersionForSchema(program, program.cdKeys);

  // Create offers for each working CD key
  const offers = program.cdKeys
    .filter(cdKey => cdKey.status === "active" || cdKey.status === "new")
    .slice(0, 10) // Limit to first 10 working keys for performance
    .map(cdKey => ({
      "@type": "Offer",
      sku: `key-${cdKey.key.slice(-8)}`,
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: `Free CD Key for ${program.title}`,
      itemCondition: "https://schema.org/NewCondition",
      ...(cdKey.validFrom ? { validFrom: cdKey.validFrom } : {}),
      ...(cdKeyHasExpiry(cdKey.validUntil) ? { validThrough: cdKey.validUntil } : {})
    }));

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
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/images/KeyAway_Logo.png`,
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
            description: `Free CD Key for ${program.title}`
          },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: workingKeys || 1,
      bestRating: "5",
      worstRating: "1"
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: BASE_URL
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Programs",
          item: `${BASE_URL}/programs`
        },
        {
          "@type": "ListItem",
          position: 3,
          name: program.title,
          item: pageUrl
        }
      ]
    }
  };

  if (softwareVersion) {
    softwareApp.softwareVersion = softwareVersion;
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

  const faq = program.faq?.filter(f => f.question?.trim() && f.answer?.trim()) ?? [];
  if (faq.length >= 2) {
    const faqPage: JsonLdData = {
      "@type": "FAQPage",
      url: `${pageUrl}#faq`,
      mainEntity: faq.map(f => ({
        "@type": "Question",
        name: f.question.trim(),
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer.trim()
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

// Utility function to safely stringify JSON-LD
export function stringifyJsonLd(jsonLd: JsonLdData): string {
  try {
    return JSON.stringify(jsonLd, null, 0);
  } catch (error) {
    console.error("Error stringifying JSON-LD:", error);
    return "{}";
  }
}
