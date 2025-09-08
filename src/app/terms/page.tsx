import { generateTermsMetadata } from "@/src/lib/metadata";

export async function generateMetadata() {
  return generateTermsMetadata();
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-neutral-800 shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-lg text-neutral-300 mb-2">Last updated: September 8, 2025</p>
            <p className="text-neutral-400">
              Read the terms of service for using our platform for sharing publicly available giveaway CD keys.
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
              User Contributions
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Visitors can share new giveaway keys or update the status of existing ones (for example, marking them as
              expired). By contributing, you agree not to post unlawful, offensive, or harmful content. KeyAway reserves
              the right to moderate or remove content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
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
                5
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
                6
              </span>
              Limitation of Liability
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              KeyAway is provided &quot;as is.&quot; We are not responsible for invalid, expired, or misused CD keys,
              nor for damages arising from the use of this website.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
