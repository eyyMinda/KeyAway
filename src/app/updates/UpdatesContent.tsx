import Link from "next/link";
import JsonLd from "@/src/components/JsonLd";
import UpdateFeedItem from "@/src/components/updates/UpdateFeedItem";
import { readSiteNotificationFeed } from "@/src/lib/notifications/notificationFeed.server";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { generateUpdatesPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveUpdatesPageSeo } from "@/src/lib/seo/trustPageSeo";

/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 43200;

export default async function UpdatesContent() {
  const [store, updates] = await Promise.all([getCachedStoreDetailsDocument(), readSiteNotificationFeed()]);
  const { pageUrl: siteUrl, storeTitle } = resolveUpdatesPageSeo(store);
  const jsonLd = generateUpdatesPageJsonLd(updates, siteUrl);

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="min-h-screen static-bg text-[#c6d4df]">
        <section className="border-b border-[#2a475e]">
          <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12 lg:px-8">
            <h1 className="section-title">
              Latest <span className="text-gradient-pro">updates</span>
            </h1>
            <p className="section-text mx-auto mt-3 max-w-xl">
              New programs and fresh giveaway keys added to {storeTitle} in the last 30 days. This feed updates
              automatically when our catalog changes.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {updates.length === 0 ? (
            <div className="rounded-sm border border-[#2a475e] bg-[#1b2838] px-5 py-10 text-center">
              <p className="text-sm text-neutral-100 sm:text-base">No catalog updates in the last 30 days.</p>
              <Link
                href="/programs"
                className="mt-4 inline-block text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
                Browse all programs →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {updates.map(item => (
                <UpdateFeedItem key={item.id} notification={item} />
              ))}
            </ul>
          )}

          <p className="mt-8 text-center text-xs text-[#8f98a0] sm:text-sm">
            Want everything?{" "}
            <Link href="/programs" className="font-semibold text-[#66c0f4] hover:text-white">
              Browse the full program catalog
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
