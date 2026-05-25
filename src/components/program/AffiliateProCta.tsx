"use client";

import Link from "next/link";
import { FaCheck, FaExternalLinkAlt } from "react-icons/fa";
import type { Program } from "@/src/types/program";
import { trackEvent } from "@/src/lib/analytics/trackEvent";

type AffiliateProCtaProps = {
  program: Program;
};

const PRO_BENEFITS = [
  "Automatic updates & new features",
  "Official vendor support",
  "No worrying about expired giveaway keys"
] as const;

export default function AffiliateProCta({ program }: AffiliateProCtaProps) {
  const url = program.affiliatePro?.affiliateProUrl?.trim();
  if (!url) return null;

  const label =
    program.affiliatePro?.affiliateProLabel?.trim() || `Get ${program.title} PRO — official store`;

  return (
    <section
      className="mx-auto max-w-360 px-4 pb-6 pt-2 sm:px-6 sm:pb-8 lg:px-8"
      aria-labelledby="affiliate-pro-cta-heading">
      <div className="overflow-hidden rounded-sm border border-[#5c8529]/35 bg-linear-to-br from-[#1e2d1a] via-[#1b2838] to-[#16202d] shadow-[0_8px_28px_rgba(0,0,0,0.45)] ring-1 ring-[#5c8529]/25">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#8bc34a]">
              Official PRO license
            </p>
            <h3
              id="affiliate-pro-cta-heading"
              className="mb-3 text-lg font-bold leading-snug text-white sm:text-xl">
              Tried the giveaways? Upgrade on the vendor&apos;s site
            </h3>
            <ul className="space-y-1.5">
              {PRO_BENEFITS.map(line => (
                <li key={line} className="flex items-start gap-2 text-sm text-[#c6d4df]">
                  <FaCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#5ba32b]" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:min-w-[220px]">
            <a
              href={url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() => {
                trackEvent("affiliate_click", {
                  programSlug: program.slug?.current,
                  path: typeof window !== "undefined" ? window.location.pathname : ""
                });
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-[#7cb342] bg-[#5c8529] px-5 py-3 text-center text-sm font-bold text-white shadow-md transition-colors hover:border-[#8bc34a] hover:bg-[#6a9c2e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8bc34a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2838] sm:text-base">
              {label}
              <FaExternalLinkAlt className="h-3.5 w-3.5 opacity-90" aria-hidden />
            </a>
            <p className="text-center text-[10px] leading-snug text-[#6d7a86] sm:text-right">
              Affiliate link ·{" "}
              <Link href="/affiliate-disclosure" className="text-[#66c0f4] underline hover:text-white">
                Disclosure
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
