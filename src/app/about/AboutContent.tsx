"use client";

import Link from "next/link";
import { ContactModalTrigger } from "@/src/components/contact";
import { useStoreDetails } from "@/src/components/providers/StoreDetailsProvider";
import TrustpilotReviewWidget from "@/src/components/trustpilot/TrustpilotReviewWidget";
import EnumeratedSectionHeading from "@/src/components/site/EnumeratedSectionHeading";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import { getTrustpilotReviewUrl } from "@/src/lib/social/socialUtils";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";
import { resolveStoreDomain, resolveStoreWebsiteHref } from "@/src/lib/site/storeIdentity";
export default function AboutContent() {
  const storeDetails = useStoreDetails();
  const storeTitle = storeDetails?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeDetails);
  const storeDomain = resolveStoreDomain(storeDetails?.seo?.siteUrl);
  const storeWebsiteHref = resolveStoreWebsiteHref(storeDetails?.seo?.siteUrl);
  const trustpilotUrl = getTrustpilotReviewUrl({ socialLinks: storeDetails?.socialLinks ?? [] });
  const githubRepoUrl =
    storeDetails?.otherLinks?.find(e => e.kind === "githubRepository" && e.url?.trim())?.url?.trim() ?? null;

  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="About"
        title={
          <>
            About <span className="text-gradient-pro">{storeTitle}</span>
          </>
        }
        subtitle={
          <>
            One trusted place to find official-style software giveaways for Windows—maintained openly, linked to vendors,
            and kept accurate by the community.
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6 rounded-sm border border-[#2a475e] bg-[#1b2838] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] sm:p-8">
          <section>
            <EnumeratedSectionHeading index={1}>Our mission</EnumeratedSectionHeading>
            <p className="leading-relaxed">
              Premium utility software is expensive. Vendors run legitimate giveaways and partner promotions—but those
              offers are scattered across blogs, forums, and campaign pages. {storeTitle} collects{" "}
              <strong className="text-white">working promotional keys</strong> in a single, readable catalog so you can
              try tools like driver updaters, PC cleaners, and uninstallers without hunting sketchy download sites.
            </p>
          </section>

          <section>
            <EnumeratedSectionHeading index={2}>
              What makes us <span className="text-gradient-pro">different</span>
            </EnumeratedSectionHeading>
            <ul className="list-inside list-disc space-y-2 leading-relaxed">
              <li>
                <strong className="text-white">Official vendor downloads</strong> — we link out to the publisher, not
                host installers
              </li>
              <li>
                <strong className="text-white">Community reporting</strong> — real activation feedback on each key row
              </li>
              <li>
                <strong className="text-white">Transparent business model</strong> —{" "}
                <Link href="/affiliate-disclosure" className="text-[#66d9ff] underline hover:text-white">
                  affiliate disclosure
                </Link>{" "}
                and clear Terms
              </li>
              <li>
                <strong className="text-white">No piracy</strong> — we do not list cracks, stolen keys, or gray-market
                resellers
              </li>
            </ul>
          </section>

          <section>
            <EnumeratedSectionHeading index={3}>Contact</EnumeratedSectionHeading>
            <div className="space-y-4 leading-relaxed">
              <p>
                <strong className="text-white">{storeTitle}</strong> —{" "}
                <a href={storeWebsiteHref} className="text-[#66d9ff] underline hover:text-white">
                  {storeDomain}
                </a>
              </p>
              <p>
                Email:{" "}
                <a href={`mailto:${supportEmail}`} className="text-[#66d9ff] underline hover:text-white">
                  {supportEmail}
                </a>
              </p>
              <p>
                <ContactModalTrigger tab="contact" className="text-[#66d9ff] underline hover:text-white">
                  Send a message
                </ContactModalTrigger>{" "}
                or{" "}
                <ContactModalTrigger tab="suggest" className="text-[#66d9ff] underline hover:text-white">
                  suggest a key
                </ContactModalTrigger>
                .
              </p>
              {githubRepoUrl ? (
                <p>
                  Open-source project:{" "}
                  <a
                    href={githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#66d9ff] underline hover:text-white">
                    view on GitHub
                  </a>
                  .
                </p>
              ) : null}
            </div>
            {trustpilotUrl ? (
              <div className="mt-6">
                <TrustpilotReviewWidget reviewUrl={trustpilotUrl} />
              </div>
            ) : null}
          </section>

          <section>
            <EnumeratedSectionHeading index={4}>Learn more</EnumeratedSectionHeading>
            <ul className="flex flex-wrap gap-4 text-sm">
              <li>
                <Link href="/how-it-works" className="text-[#66d9ff] underline hover:text-white">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[#66d9ff] underline hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#66d9ff] underline hover:text-white">
                  Privacy
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
