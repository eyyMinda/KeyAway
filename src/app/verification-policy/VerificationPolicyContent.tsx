"use client";

import Link from "next/link";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";

export default function VerificationPolicyContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeDetails);

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Policy"
        title={
          <>
            Verification <span className="text-gradient-pro">Policy</span>
          </>
        }
        subtitle={<>How {storeTitle} keeps giveaway listings accurate and what we do not guarantee.</>}
        lastUpdated="May 25, 2026"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>Community key reports</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Visitors can report working, expired, or limit-reached status per key row. Aggregated reports influence
              sort order and the green &quot;working&quot; percentage bar. This is crowd-sourced activation feedback—not
              malware scanning or a legal warranty.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>Editorial review</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Keys suggested through our forms are reviewed before publication. Administrators may edit status, remove
              invalid entries, or mark keys expired when validity dates pass (including automated expiry checks).
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>License limitations</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Giveaway keys may be time-limited, non-commercial, or tied to a specific product version. Always read the
              vendor&apos;s license terms. {storeTitle} does not provide vendor technical support for promotional keys.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={4}>Outbound links</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              We link to official vendor download and upgrade pages we recognize. Affiliate relationships are disclosed
              on our{" "}
              <Link href="/affiliate-disclosure" className="text-[#66d9ff] underline hover:text-white">
                Affiliate Disclosure
              </Link>{" "}
              page.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={5}>Report an issue</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Wrong listing, expired campaign, or content concern:{" "}
              <a href={`mailto:${supportEmail}`} className="text-[#66d9ff] underline hover:text-white">
                {supportEmail}
              </a>{" "}
              or see{" "}
              <Link href="/dmca" className="text-[#66d9ff] underline hover:text-white">
                Report content
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
