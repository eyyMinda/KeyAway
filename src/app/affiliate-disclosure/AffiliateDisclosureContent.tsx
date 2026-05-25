"use client";

import Link from "next/link";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { resolveStoreDomain, resolveStoreWebsiteHref } from "@/src/lib/site/storeIdentity";

export default function AffiliateDisclosureContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const storeDomain = resolveStoreDomain(storeDetails?.seo?.siteUrl);
  const storeWebsiteHref = resolveStoreWebsiteHref(storeDetails?.seo?.siteUrl);

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Transparency"
        title={
          <>
            Affiliate <span className="text-gradient-pro">Disclosure</span>
          </>
        }
        subtitle={
          <>
            {storeTitle} does not sell software on {storeDomain}. This page explains outbound links and how affiliate
            relationships support the site.
          </>
        }
        lastUpdated="May 25, 2026"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>No checkout on {storeTitle}</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              {storeTitle} at{" "}
              <a href={storeWebsiteHref} className="text-[#66d9ff] underline hover:text-white">
                {storeDomain}
              </a>{" "}
              is <strong className="text-white">not</strong> a store. You cannot buy licenses, subscriptions, or
              downloads from us directly. All purchases happen on third-party vendor websites under their terms and
              privacy policies.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>Affiliate and partner links</EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>
                Some outbound links—such as official <strong className="text-white">download</strong> pages,{" "}
                <strong className="text-white">Pro upgrade</strong> offers, or promotional banners—may be{" "}
                <strong className="text-white">affiliate links</strong> arranged with software vendors or their partners.
              </p>
              <p>
                If you visit a vendor&apos;s site through such a link and make a purchase <em>on that vendor&apos;s site</em>,{" "}
                {storeTitle} may earn a small commission at <strong className="text-white">no extra cost to you</strong>.
                Prices, checkout, refunds, and support are always controlled by the vendor.
              </p>
              <p>
                These arrangements help operate {storeTitle} and keep giveaway listings free to browse. Copying publicly
                listed giveaway keys does not require a purchase.
              </p>
            </div>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>How we label links</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Program pages may show a short disclosure near official Pro upgrade buttons. Affiliate outbound links use{" "}
              <code className="rounded bg-[#213246] px-1.5 py-0.5 text-sm text-[#9fc6e3]">rel=&quot;sponsored&quot;</code>{" "}
              in addition to standard security attributes. Non-affiliate vendor download links may use{" "}
              <code className="rounded bg-[#213246] px-1.5 py-0.5 text-sm text-[#9fc6e3]">nofollow</code> where
              appropriate.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={4}>Third-party sites</EnumeratedSectionHeading>
            <div className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] p-4">
              <p className="text-sm leading-relaxed">
                When you leave {storeTitle}, the vendor&apos;s cookies, analytics, and payment processing apply. We do
                not control those sites. Read their policies before purchasing.
              </p>
            </div>
          </section>

          <section>
            <EnumeratedSectionHeading index={5}>Related policies</EnumeratedSectionHeading>
            <ul className="flex flex-wrap gap-4 text-sm">
              <li>
                <Link href="/terms" className="text-[#66d9ff] underline hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#66d9ff] underline hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-[#66d9ff] underline hover:text-white">
                  How it works
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
