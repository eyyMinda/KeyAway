"use client";

import Link from "next/link";
import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";

export default function PartnersContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeDetails);

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Partners"
        title={
          <>
            Work with <span className="text-gradient-pro">{storeTitle}</span>
          </>
        }
        subtitle={<>Official giveaways, partner campaigns, and affiliate-friendly utility software.</>}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>For software vendors</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              {storeTitle} lists legal promotional keys and activation flows for Windows utility software. If you run an
              official giveaway, partner promo, or affiliate campaign, we can feature it with clear sourcing labels and
              links to your official download page.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>What we offer</EnumeratedSectionHeading>
            <ul className="list-inside list-disc space-y-2 leading-relaxed">
              <li>Dedicated program pages with community status reporting</li>
              <li>Transparent key-source and affiliate disclosures</li>
              <li>Optional Pro upgrade CTAs using your official affiliate URLs</li>
            </ul>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>Get in touch</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              <a href={`mailto:${supportEmail}`} className="text-[#66d9ff] underline hover:text-white">
                {supportEmail}
              </a>{" "}
              — or{" "}
              <ContactModalTrigger tab="contact" className="text-[#66d9ff] underline hover:text-white">
                contact us
              </ContactModalTrigger>
              . See also{" "}
              <Link href="/how-it-works" className="text-[#66d9ff] underline hover:text-white">
                How it works
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
