import { generatePrivacyMetadata } from "@/src/lib/metadata";

export async function generateMetadata() {
  return generatePrivacyMetadata();
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-neutral-800 shadow-soft">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
            <p className="text-lg text-neutral-300 mb-2">Last updated: September 8, 2025</p>
            <p className="text-neutral-400">
              Learn how we handle your personal data, comments, and contributions while keeping the site transparent.
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
              Information We Collect
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              KeyAway does not require account registration. We may collect limited information if you post comments
              (such as your GitHub profile if using Giscus) or make a donation through a third-party service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Purpose of Content
            </h2>
            <div className="space-y-4">
              <p className="text-neutral-300 leading-relaxed">
                All CD keys listed on KeyAway are <strong className="text-primary-400">public giveaway keys</strong>{" "}
                provided directly by software distributors. They are made available to everyone for a limited time or
                version. We simply aggregate and display them in one place to make them easier to access.
              </p>
              <div className="bg-success-900/20 border border-success-700/30 rounded-xl p-4">
                <p className="text-success-300 font-semibold">
                  <strong>No stolen, pirated, or unauthorized keys are hosted or distributed.</strong>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              Cookies and Analytics
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              We may use basic analytics or cookies to understand site usage. No personal data is sold or shared with
              advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              Third-Party Services
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              Comments and donations are handled by trusted third-party services (e.g., GitHub Discussions, PayPal, or
              similar). Please refer to their respective privacy policies for details.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                5
              </span>
              Data Security
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              We take reasonable measures to protect your data. However, no online service is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                6
              </span>
              Contact
            </h2>
            <p className="text-neutral-300 leading-relaxed">
              If you have questions about this Privacy Policy, please reach out through the contact link on our site or
              GitHub repository.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
