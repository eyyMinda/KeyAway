import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/src/components/JsonLd";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getCachedVendorsWithCounts } from "@/src/lib/vendors/getVendors";
import { generateVendorsPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveVendorsIndexSeo } from "@/src/lib/seo/vendorSeo";
import { urlFor } from "@/src/sanity/lib/image";

/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 43200;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getCachedStoreDetailsDocument();
  const { title, description, pageUrl: url, ogImageUrl, storeTitle } = resolveVendorsIndexSeo(store);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: storeTitle,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${storeTitle} — Vendors` }]
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImageUrl] },
    alternates: { canonical: url }
  };
}

export default async function VendorsPage() {
  const [store, vendors] = await Promise.all([getCachedStoreDetailsDocument(), getCachedVendorsWithCounts()]);
  const { siteUrl } = resolveVendorsIndexSeo(store);
  const jsonLd = generateVendorsPageJsonLd(vendors, siteUrl);

  return (
    <>
      <JsonLd data={jsonLd} />

      <section className="border-b border-[#2a475e]">
        <div className="mx-auto w-full max-w-360 px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-12 lg:px-8">
          <div className="section-label">Vendors</div>
          <h1 className="section-title mt-2">
            Software <span className="text-gradient-pro">publishers &amp; brands</span>
          </h1>
          <p className="section-text mt-3 max-w-2xl">
            Browse giveaways and free CD keys grouped by the company that makes the software. Each hub lists every
            program we track for that vendor, plus official PRO upgrade options.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-360 px-4 py-8 sm:px-6 lg:px-8">
        {vendors.length === 0 ? (
          <p className="text-sm text-neutral-100">No vendors published yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {vendors.map(vendor => (
              <li key={vendor._id}>
                <Link
                  href={`/vendors/${vendor.slug}`}
                  className="group flex h-full items-center gap-4 rounded-sm border border-[#2a475e] bg-[#16202d] p-4 transition-colors hover:border-[#4a90c4]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[#2a475e] bg-[#0e1621]">
                    {vendor.logo ? (
                      <Image
                        src={urlFor(vendor.logo).width(112).height(112).fit("max").url()}
                        alt={`${vendor.name} logo`}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-lg font-bold text-[#66c0f4]">{vendor.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#c6d4df] group-hover:text-white">{vendor.name}</div>
                    <div className="mt-0.5 text-xs text-neutral-100">
                      {vendor.programCount} program{vendor.programCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
