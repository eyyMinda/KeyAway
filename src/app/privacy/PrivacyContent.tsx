"use client";

import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import { resolveStoreDisplayName } from "@/src/lib/site/storeIdentity";

export default function PrivacyContent() {
  const storeDetails = useStoreDetails();
  const storeDisplayName = resolveStoreDisplayName(storeDetails?.title, storeDetails?.seo?.siteUrl);
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";

  return (
    <main className="min-h-screen bg-[#0f1923] text-[#c6d4df]">
      {/* Hero Section */}
      <div className="border-b border-[#2a475e] bg-[#16202d]">
        <div className="mx-auto max-w-360 px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="section-label mx-auto mb-4">Legal</div>
            <h1 className="section-title mb-4">
              Privacy <span className="text-gradient-pro">Policy</span>
            </h1>
            <p className="mb-3 text-base text-[#8f98a0]">Last updated: April 20, 2026</p>
            <p className="mx-auto max-w-3xl text-[#c6d4df]">
              {storeDisplayName} is the service described in this policy. Learn how we handle your personal data,
              comments, and contributions while keeping the site transparent.
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
              Information We <span className="text-gradient-pro">Collect</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                {storeTitle} does not require account registration. We may collect limited information when you:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-[#c6d4df]">
                <li>Post comments (such as your GitHub profile if using Giscus)</li>
                <li>Make a donation through a third-party service</li>
                <li>
                  Submit CD key suggestions or contact us (name, email, and message content - stored securely via Sanity
                  CMS)
                </li>
                <li>Report key status (anonymous, no personal data collected)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                2
              </span>
              Purpose of <span className="text-gradient-pro">Content</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                All CD keys listed on {storeTitle} are <strong className="text-[#66d9ff]">public giveaway keys</strong>{" "}
                provided directly by software distributors. They are made available to everyone for a limited time or
                version. We simply aggregate and display them in one place to make them easier to access.
              </p>
              <div className="rounded-sm border border-[#3f6441] bg-[#1c3021] p-4">
                <p className="font-semibold text-[#9fd7a3]">
                  <strong>No stolen, pirated, or unauthorized keys are hosted or distributed.</strong>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                3
              </span>
              Cookies and <span className="text-gradient-pro">Analytics</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              We may use basic analytics or cookies to understand site usage. No personal data is sold or shared with
              advertisers.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                4
              </span>
              Third-Party <span className="text-gradient-pro">Services</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                Comments and donations are handled by trusted third-party services (e.g., GitHub Discussions, PayPal, or
                similar). Please refer to their respective privacy policies for details.
              </p>
              <p className="leading-relaxed text-[#c6d4df]">
                When you follow links to <strong className="text-[#66d9ff]">software vendors</strong>
                {` (including official download links, upgrade offers, or promotional banners), you leave ${storeTitle}. Those sites may use cookies, analytics, and payment processing under their own privacy policies. Some links may be affiliate links; ${storeTitle} does not sell products on this site-any purchase happens on the vendor's site. See the `}
                <strong className="text-white">Affiliate disclosure and outbound links</strong>
                {" section in our "}
                <a href="/terms" className="text-[#66d9ff] underline hover:text-white">
                  Terms of Service
                </a>
                {" for how affiliate relationships work."}
              </p>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                5
              </span>
              Key Suggestions &amp; <span className="text-gradient-pro">Contact Forms</span>
            </h2>
            <div className="space-y-4">
              <p className="leading-relaxed text-[#c6d4df]">
                When you submit a CD key suggestion or contact us through our forms:
              </p>
              <ul className="ml-4 list-inside list-disc space-y-2 text-[#c6d4df]">
                <li>
                  <strong className="text-[#66d9ff]">Data Collected:</strong> Your name, email, and message/key details
                </li>
                <li>
                  <strong className="text-[#66d9ff]">Purpose:</strong> To verify and publish legitimate keys, or to
                  respond to your inquiry
                </li>
                <li>
                  <strong className="text-[#66d9ff]">Storage:</strong> Submissions are stored securely in Sanity CMS and
                  are only accessible by site administrators
                </li>
                <li>
                  <strong className="text-[#66d9ff]">Retention:</strong> We retain submissions until they are processed.
                  Contact messages may be kept for support purposes
                </li>
                <li>
                  <strong className="text-[#66d9ff]">No Sharing:</strong> Your personal information is never shared with
                  third parties or used for marketing
                </li>
              </ul>
              <div className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] p-4">
                <p className="text-sm text-[#9fc6e3]">
                  <strong>Note:</strong> Only the CD keys themselves (not your personal info) are published publicly
                  after verification. Your email is used solely for communication if needed.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                6
              </span>
              Data <span className="text-gradient-pro">Security</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              We take reasonable measures to protect your data, including secure HTTPS connections and trusted CMS
              infrastructure. However, no online service is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="section-title mb-4 flex items-center">
              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border border-[#4a90c4] bg-[#1a2f45] text-sm font-bold text-[#66c0f4]">
                7
              </span>
              <span className="text-gradient-pro">Contact</span>
            </h2>
            <p className="leading-relaxed text-[#c6d4df]">
              If you have questions about this Privacy Policy, please{" "}
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
