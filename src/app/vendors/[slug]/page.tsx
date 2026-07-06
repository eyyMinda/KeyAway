import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import JsonLd from "@/src/components/JsonLd";
import Breadcrumbs from "@/src/components/layout/Breadcrumbs";
import RichText from "@/src/components/portableText/RichText";
import ProgramsGrid from "@/src/components/programs/ProgramsGrid";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getCachedVendorSlugs, getVendorBySlug } from "@/src/lib/vendors/getVendors";
import { generateVendorPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveVendorHubSeo } from "@/src/lib/seo/vendorSeo";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import { urlFor } from "@/src/sanity/lib/image";

/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 43200;

interface VendorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getCachedVendorSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [store, vendor] = await Promise.all([getCachedStoreDetailsDocument(), getVendorBySlug(slug)]);
  if (!vendor) return { title: "Vendor not found", robots: { index: false, follow: true } };

  const { title, description, pageUrl: url, ogImageUrl, storeTitle } = resolveVendorHubSeo(store, {
    name: vendor.name,
    slug: vendor.slug,
    programCount: vendor.programs.length,
    seo: vendor.seo
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: storeTitle,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${vendor.name} on ${storeTitle}` }]
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
    alternates: { canonical: url }
  };
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params;
  const [store, vendor] = await Promise.all([getCachedStoreDetailsDocument(), getVendorBySlug(slug)]);
  if (!vendor) return notFound();

  const { siteUrl } = resolveVendorHubSeo(store, {
    name: vendor.name,
    slug: vendor.slug,
    programCount: vendor.programs.length
  });

  const jsonLd = generateVendorPageJsonLd(
    { name: vendor.name, slug: vendor.slug, description: portableTextToPlainText(vendor.description) || undefined },
    vendor.programs,
    siteUrl
  );

  const maxViews = vendor.programs.reduce((m, p) => Math.max(m, p.viewCount ?? 0), 0);
  const maxDownloads = vendor.programs.reduce((m, p) => Math.max(m, p.downloadCount ?? 0), 0);
  const hasDescription = portableTextToPlainText(vendor.description).length > 0;

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="border-b border-[#2a475e]">
        <div className="mx-auto w-full max-w-360 px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: "/" },
              { label: "Vendors", href: "/vendors" },
              { label: vendor.name }
            ]}
          />

          <div className="flex items-center gap-4">
            {vendor.logo && (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#2a475e] bg-[#0e1621]">
                <Image
                  src={urlFor(vendor.logo).width(128).height(128).fit("max").url()}
                  alt={`${vendor.name} logo`}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain p-1.5"
                />
              </div>
            )}
            <div>
              <div className="section-label">Vendor</div>
              <h1 className="section-title mt-1">
                {vendor.name} <span className="text-gradient-pro">CD keys &amp; giveaways</span>
              </h1>
            </div>
          </div>

          {hasDescription && (
            <div className="section-text mt-4 max-w-3xl">
              <RichText value={vendor.description} />
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="mb-5 text-lg font-semibold text-[#c6d4df] sm:text-xl">
          {vendor.programs.length} program{vendor.programs.length === 1 ? "" : "s"} from {vendor.name}
        </h2>
        <ProgramsGrid programs={vendor.programs} maxViews={maxViews} maxDownloads={maxDownloads} />
      </section>
    </>
  );
}
