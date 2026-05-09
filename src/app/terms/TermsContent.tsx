"use client";

import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import { resolveStoreDisplayName, resolveStoreDomain, resolveStoreWebsiteHref } from "@/src/lib/site/storeIdentity";

export default function TermsContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const storeDisplayName = resolveStoreDisplayName(storeDetails?.title, storeDetails?.seo?.siteUrl);
  const storeDomain = resolveStoreDomain(storeDetails?.seo?.siteUrl);
  const storeWebsiteHref = resolveStoreWebsiteHref(storeDetails?.seo?.siteUrl);

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#c6d4df]">
      {/* Hero Section */}
      <div className="border-b border-[#2a475e] bg-[#16202d]">
        <div className="mx-auto max-w-360 px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="section-label mx-auto mb-4">Legal</div>
            <h1 className="section-title mb-4">
              Terms of <span className="text-gradient-pro">Service</span>
            </h1>
            <p className="mb-3 text-base text-[#8f98a0]">Last updated: April 20, 2026</p>
            <p className="mx-auto max-w-3xl text-[#c6d4df]">
              {storeTitle} is the service operated at{" "}
              <a href={storeWebsiteHref} className="text-[#66d9ff] underline hover:text-white">
                {storeDomain}
              </a>
              . These terms govern your use of our platform for sharing publicly available giveaway CD keys.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                1
              </span>
              Acceptance of <span className="text-gradient-pro">Terms</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              By accessing and using KeyAway, you agree to comply with these Terms of Service. If you do not agree,
              please discontinue use of the website.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                2
              </span>
              Purpose of the <span className="text-gradient-pro">Site</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                {storeTitle} provides access to publicly available giveaway CD keys for selected software programs.
                These keys are released by the software distributors themselves as limited-time or version-specific
                promotional offers.
              </p>
              <div className="rounded-sm border border-[#3f6441] bg-[#1c3021] p-4">
                <p className="font-semibold text-[#9fd7a3]">
                  <strong>We do not host, distribute, or promote pirated or stolen keys.</strong>
                  <br />
                  <span className="text-[#cde9cf]">
                    {storeTitle}&apos;s role is to make legitimate giveaway keys easier to discover in one place.
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                3
              </span>
              Affiliate disclosure and <span className="text-gradient-pro">outbound links</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                {storeTitle} does <strong className="text-white">not</strong> sell software, licenses, or subscriptions
                on this website. There is no checkout on {storeDomain} - you cannot complete a purchase here.
              </p>
              <p className="leading-relaxed text-[#c6d4df]">
                Some outbound links (for example official <strong className="text-[#66d9ff]">download</strong> links,
                upgrade or Pro-license offers, or promotional banners) may be{" "}
                <strong className="text-white">affiliate links</strong>
                {
                  " arranged with software vendors or their partners. If you visit a vendor's site through such a link and make a purchase "
                }
                <em>on that vendor&apos;s site</em>
                {`, ${storeTitle} may earn a small commission from the vendor at `}
                <strong className="text-white">no extra cost to you</strong>
                {`. Prices and checkout are always controlled by the vendor, not ${storeTitle}.`}
              </p>
              <p className="text-neutral-100 leading-relaxed">
                These arrangements help support the operation of the site and keep giveaway listings and content free.
                Browsing {storeTitle} and copying publicly listed giveaway keys does not require a purchase.
              </p>
              <div className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] p-4">
                <p className="text-sm leading-relaxed text-[#c6d4df]">
                  <strong className="text-[#9fc6e3]">Third-party sites:</strong>
                  {
                    " When you leave KeyAway, the vendor's terms, privacy policy, and payment processing apply. We do not control those sites."
                  }
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                4
              </span>
              User Contributions &amp; <span className="text-gradient-pro">Key Suggestions</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">Users can contribute to KeyAway by:</p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-[#c6d4df]">
                <li>
                  <strong className="text-[#66d9ff]">Suggesting CD Keys:</strong> Submit new legitimate giveaway keys
                  for any software through our suggestion form
                </li>
                <li>
                  <strong className="text-[#66d9ff]">Reporting Key Status:</strong> Mark keys as working, expired, or
                  limit reached to help maintain accuracy
                </li>
                <li>
                  <strong className="text-[#66d9ff]">Posting Comments:</strong> Engage with the community through our
                  commenting system
                </li>
              </ul>
              <div className="rounded-sm border border-[#6a5933] bg-[#352d1d] p-4">
                <p className="text-sm text-[#e3c884]">
                  <strong>By contributing, you agree:</strong>
                  <br />
                  • To only submit legitimate giveaway keys from official sources
                  <br />
                  • Not to post unlawful, offensive, or harmful content
                  <br />• That {storeDisplayName} reserves the right to moderate, verify, or remove any submission
                  <br />• That submitted keys may be published publicly after verification
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                5
              </span>
              Validity of <span className="text-gradient-pro">Keys</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              Giveaway keys may only work with specific versions of the software and for a limited time. We cannot
              guarantee their availability or functionality once the distributor ends the promotion.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                6
              </span>
              <span className="text-gradient-pro">Donations</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              Donations are voluntary and non-refundable. They are used solely to support the operation and hosting of
              the website.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                7
              </span>
              Limitation of <span className="text-gradient-pro">Liability</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              {storeTitle} is provided &quot;as is.&quot; We are not responsible for invalid, expired, or misused CD
              keys, nor for damages arising from the use of this website.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                8
              </span>
              Contact &amp; <span className="text-gradient-pro">Questions</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              If you have any questions about these Terms of Service or need to report an issue, please{" "}
              <ContactModalTrigger
                tab="contact"
                className="inline cursor-pointer text-[#66d9ff] underline hover:text-white">
                contact us
              </ContactModalTrigger>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
