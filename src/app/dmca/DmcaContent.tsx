"use client";

import Link from "next/link";
import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";

export default function DmcaContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeDetails);

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Policy"
        title={
          <>
            Report <span className="text-gradient-pro">Content</span>
          </>
        }
        subtitle={<>How to notify {storeTitle} about copyright, trademark, or listing concerns.</>}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>What to send</EnumeratedSectionHeading>
            <ul className="list-inside list-disc space-y-2 leading-relaxed">
              <li>Your contact name and email</li>
              <li>URL of the program page or content in question</li>
              <li>Description of the issue (copyright, trademark, inaccurate listing, etc.)</li>
              <li>Proof of ownership or authority to act, if applicable</li>
            </ul>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>How to reach us</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Email{" "}
              <a href={`mailto:${supportEmail}`} className="text-[#66d9ff] underline hover:text-white">
                {supportEmail}
              </a>{" "}
              with subject line &quot;Content report — {storeTitle}&quot; or{" "}
              <ContactModalTrigger tab="contact" className="text-[#66d9ff] underline hover:text-white">
                use the contact form
              </ContactModalTrigger>
              .
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>What we may do</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              After review we may update, hide, or remove listings, keys, or comments. We aim to respond to good-faith
              reports promptly.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={4}>Related</EnumeratedSectionHeading>
            <Link href="/verification-policy" className="text-[#66d9ff] underline hover:text-white">
              Verification Policy
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
