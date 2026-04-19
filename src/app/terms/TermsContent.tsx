"use client";

import { ContactModalTrigger } from "@/src/components/contact";

export default function TermsContent() {
  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-neutral-800 shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-lg text-neutral-300 mb-2">Last updated: April 20, 2026</p>
            <p className="text-neutral-400">
              KeyAway is the service operated at{" "}
              <a href="https://www.keyaway.app" className="text-primary-400 hover:text-primary-300 underline">
                keyaway.app
              </a>
              . These terms govern your use of our platform for sharing publicly available giveaway CD keys.
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-neutral-800 rounded-2xl shadow-soft p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              Acceptance of Terms
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              By accessing and using KeyAway, you agree to comply with these Terms of Service. If you do not agree,
              please discontinue use of the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Purpose of the Site
            </h2>
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                KeyAway provides access to publicly available giveaway CD keys for selected software programs. These
                keys are released by the software distributors themselves as limited-time or version-specific
                promotional offers.
              </p>
              <div className="bg-success-900/20 border border-success-700/30 rounded-xl p-4">
                <p className="text-success-300 font-semibold">
                  <strong>We do not host, distribute, or promote pirated or stolen keys.</strong>
                  <br />
                  <span className="text-success-200">
                    KeyAway&apos;s role is to make legitimate giveaway keys easier to discover in one place.
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              Affiliate disclosure and outbound links
            </h2>
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                KeyAway does <strong className="text-white">not</strong> sell software, licenses, or subscriptions on
                this website. There is no checkout on keyaway.app—you cannot complete a purchase here.
              </p>
              <p className="text-neutral-300 leading-relaxed">
                Some outbound links (for example official <strong className="text-primary-400">download</strong> links,
                upgrade or Pro-license offers, or promotional banners) may be{" "}
                <strong className="text-white">affiliate links</strong>
                {
                  " arranged with software vendors or their partners. If you visit a vendor's site through such a link and make a purchase "
                }
                <em>on that vendor&apos;s site</em>
                {", KeyAway may earn a small commission from the vendor at "}
                <strong className="text-white">no extra cost to you</strong>
                {". Prices and checkout are always controlled by the vendor, not KeyAway."}
              </p>
              <p className="text-neutral-300 leading-relaxed">
                These arrangements help support the operation of the site and keep giveaway listings and content free.
                Browsing KeyAway and copying publicly listed giveaway keys does not require a purchase.
              </p>
              <div className="bg-primary-900/20 border border-primary-700/30 rounded-xl p-4">
                <p className="text-neutral-200 text-sm leading-relaxed">
                  <strong className="text-primary-300">Third-party sites:</strong>
                  {
                    " When you leave KeyAway, the vendor's terms, privacy policy, and payment processing apply. We do not control those sites."
                  }
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              User Contributions &amp; Key Suggestions
            </h2>
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">Users can contribute to KeyAway by:</p>
              <ul className="list-disc list-inside text-neutral-300 space-y-2 ml-4">
                <li>
                  <strong className="text-primary-400">Suggesting CD Keys:</strong> Submit new legitimate giveaway keys
                  for any software through our suggestion form
                </li>
                <li>
                  <strong className="text-primary-400">Reporting Key Status:</strong> Mark keys as working, expired, or
                  limit reached to help maintain accuracy
                </li>
                <li>
                  <strong className="text-primary-400">Posting Comments:</strong> Engage with the community through our
                  commenting system
                </li>
              </ul>
              <div className="bg-warning-900/20 border border-warning-700/30 rounded-xl p-4">
                <p className="text-warning-300 text-sm">
                  <strong>By contributing, you agree:</strong>
                  <br />
                  • To only submit legitimate giveaway keys from official sources
                  <br />
                  • Not to post unlawful, offensive, or harmful content
                  <br />
                  • That KeyAway reserves the right to moderate, verify, or remove any submission
                  <br />• That submitted keys may be published publicly after verification
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              Validity of Keys
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Giveaway keys may only work with specific versions of the software and for a limited time. We cannot
              guarantee their availability or functionality once the distributor ends the promotion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                6
              </span>
              Donations
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Donations are voluntary and non-refundable. They are used solely to support the operation and hosting of
              the website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                7
              </span>
              Limitation of Liability
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              KeyAway is provided &quot;as is.&quot; We are not responsible for invalid, expired, or misused CD keys,
              nor for damages arising from the use of this website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                8
              </span>
              Contact &amp; Questions
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              If you have any questions about these Terms of Service or need to report an issue, please{" "}
              <ContactModalTrigger
                tab="contact"
                className="text-primary-400 hover:text-primary-300 underline cursor-pointer inline">
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
