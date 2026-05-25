"use client";

import Link from "next/link";
import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";
import { resolveStoreDomain, resolveStoreWebsiteHref } from "@/src/lib/site/storeIdentity";

export default function HowItWorksContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeDetails);
  const storeDomain = resolveStoreDomain(storeDetails?.seo?.siteUrl);
  const storeWebsiteHref = resolveStoreWebsiteHref(storeDetails?.seo?.siteUrl);
  const githubRepoUrl =
    storeDetails?.otherLinks?.find(e => e.kind === "githubRepository" && e.url?.trim())?.url?.trim() ?? null;

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Transparency"
        title={
          <>
            How <span className="text-gradient-pro">{storeTitle}</span> Works
          </>
        }
        subtitle={
          <>
            {storeTitle} is a giveaway hub for Windows utility software—promotional CD keys and activation links gathered
            in one place, with community reporting to keep listings honest.
          </>
        }
        lastUpdated="May 25, 2026"
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>
              What <span className="text-gradient-pro">{storeTitle}</span> is
            </EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>
                {storeTitle} at{" "}
                <a href={storeWebsiteHref} className="text-[#66d9ff] underline hover:text-white">
                  {storeDomain}
                </a>{" "}
                helps you discover <strong className="text-white">legal promotional licenses</strong> for professional
                PC software—driver tools, optimizers, uninstallers, and similar utilities vendors sometimes give away
                for free or through partner campaigns.
              </p>
              <p>
                We are an <strong className="text-white">aggregator and community-maintained directory</strong>, not a
                software store. There is no checkout on {storeTitle}; you copy keys here and activate on the vendor&apos;s
                official installer.
              </p>
            </div>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>
              How keys <span className="text-gradient-pro">get listed</span>
            </EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>Keys and activation entries on program pages come from a mix of:</p>
              <ul className="list-inside list-disc space-y-2 text-[#c6d4df]">
                <li>
                  <strong className="text-white">Editorial listings</strong> — added and updated in our content system by
                  the {storeTitle} team
                </li>
                <li>
                  <strong className="text-white">Community suggestions</strong> — submitted via the Suggest a Key flow,
                  reviewed before publish
                </li>
                <li>
                  <strong className="text-white">Vendor-aligned promos</strong> — official giveaway pages, affiliate
                  campaigns, or time-limited partner offers (labeled per program when configured)
                </li>
              </ul>
              <p>
                Each program links to an <strong className="text-white">official vendor download</strong> when we have one.
                We do not mirror installers or repackage executables.
              </p>
            </div>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>
              Community reports <span className="text-gradient-pro">vs certification</span>
            </EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>
                Visitors can report whether a key <strong className="text-white">worked</strong>, is{" "}
                <strong className="text-white">expired</strong>, or hit an activation{" "}
                <strong className="text-white">limit</strong>. Those reports update status bars and sorting on each row.
              </p>
              <div className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] p-4">
                <p className="text-sm leading-relaxed">
                  <strong className="text-[#9fc6e3]">Important:</strong> a high &quot;working&quot; percentage means
                  other users recently had success—it is <em>not</em> a malware scan, legal guarantee, or vendor
                  endorsement. {storeTitle} does not re-test every key on every PC configuration.
                </p>
              </div>
            </div>
          </section>

          <section>
            <EnumeratedSectionHeading index={4}>
              What we <span className="text-gradient-pro">never</span> host
            </EnumeratedSectionHeading>
            <div className="rounded-sm border border-[#3f6441] bg-[#1c3021] p-4">
              <ul className="space-y-2 text-[#cde9cf]">
                <li>Cracked, pirated, or stolen license keys</li>
                <li>Unauthorized key generators or &quot;loader&quot; tools</li>
                <li>Gray-market reseller keys presented as official giveaways</li>
                <li>Repackaged or modified installers hosted on {storeTitle}</li>
              </ul>
            </div>
            <p className="mt-4 leading-relaxed">
              See also our <Link href="/terms" className="text-[#66d9ff] underline hover:text-white">Terms of Service</Link>{" "}
              for the full anti-piracy stance.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={5}>
              How we <span className="text-gradient-pro">make money</span>
            </EnumeratedSectionHeading>
            <p className="leading-relaxed">
              {storeTitle} may earn a commission when you follow an official vendor or partner link and purchase on their
              site. Browsing and copying giveaway keys does not require a purchase. Details:{" "}
              <Link href="/affiliate-disclosure" className="text-[#66d9ff] underline hover:text-white">
                Affiliate Disclosure
              </Link>
              .
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={6}>
              Open &amp; <span className="text-gradient-pro">contact</span>
            </EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>
                Questions or partnership inquiries:{" "}
                <a href={`mailto:${supportEmail}`} className="text-[#66d9ff] underline hover:text-white">
                  {supportEmail}
                </a>{" "}
                or{" "}
                <ContactModalTrigger tab="contact" className="text-[#66d9ff] underline hover:text-white">
                  contact us
                </ContactModalTrigger>
                .
              </p>
              {githubRepoUrl ? (
                <p>
                  Source code:{" "}
                  <a
                    href={githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#66d9ff] underline hover:text-white">
                    GitHub repository
                  </a>
                  . Technical overview for crawlers:{" "}
                  <a href="/llms.txt" target="_blank" rel="noreferrer" className="text-[#66d9ff] underline hover:text-white">
                    llms.txt
                  </a>
                  .
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
