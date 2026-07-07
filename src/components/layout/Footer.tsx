"use client";

import { SanityLink } from "@/src/types";
import type { FooterProps } from "@/src/types/layout";
import { useStoreDetails } from "@components/providers/StoreDetailsProvider";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import Link from "next/link";
import { useState } from "react";
import { IdealImageClient } from "../general/IdealImageClient";
import { usePathname } from "next/navigation";
import { FaKey, FaEnvelope, FaChevronRight } from "react-icons/fa";
import { ContactModal, ContactModalTrigger } from "@/src/components/contact";
import { Socials, FacebookGroupButton } from "@/src/components/social";
import FooterMiniSocialShare from "@/src/components/social-share/FooterMiniSocialShare";
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import TrustpilotReviewWidget from "@/src/components/trustpilot/TrustpilotReviewWidget";
import { getTrustpilotReviewUrl } from "@/src/lib/social/socialUtils";
import { resolveSupportEmail } from "@/src/lib/site/supportEmail";

const TRUST_FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/verification-policy", label: "Verification policy" },
  { href: "/partners", label: "Partners" },
  { href: "/updates", label: "Updates" }
] as const;

export default function Footer({ logoData, socialData, siteBaseUrl }: FooterProps) {
  const storeData = useStoreDetails();
  const pathname = usePathname();
  const trustpilotUrl = getTrustpilotReviewUrl(socialData);
  const footer = storeData?.footer;
  const shouldShowTrustpilot = !pathname.startsWith("/admin") && !pathname.startsWith("/studio");
  let isLogo = false;
  let footerLinks: SanityLink[] = [];
  if (footer && (footer.footerLinks || footer.isLogo)) {
    if (storeData.logo) isLogo = footer.isLogo;
    footerLinks = footer.footerLinks || [];
  }

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const storeTitle = storeData?.title?.trim() || "KeyAway";
  const supportEmail = resolveSupportEmail(storeData);

  const ol = storeData?.otherLinks;
  const buyMeACoffeeUrl = ol?.find(e => e.kind === "buymeacoffee" && e.url?.trim())?.url?.trim() ?? null;
  const githubRepoUrl = ol?.find(e => e.kind === "githubRepository" && e.url?.trim())?.url?.trim() ?? null;
  const hasSupportLinks = Boolean(buyMeACoffeeUrl || githubRepoUrl);

  return (
    <footer className="mt-auto border-t border-[#2a475e] bg-[#0E141B] text-neutral-100">
      <div className="mx-auto w-full max-w-360 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-y-8 gap-x-2">
          {/* Brand Section */}
          <div className="col-span-1 xs:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-block w-fit pr-4">
              {isLogo ? (
                <IdealImageClient {...logoData} className="h-12 w-auto" />
              ) : (
                <h3 className="text-2xl font-bold text-white">{storeData.title}</h3>
              )}
            </Link>
            <p className="mb-2 max-w-md section-text">
              {portableTextToPlainText(storeData.description) ||
                "Free Giveaway CD Keys for your favorite games and software."}
            </p>
            <p className="text-sm text-[#8f98a0]">
              <span className="font-medium text-[#c6d4df]">{storeTitle}</span>
              {" · "}
              <a href={`mailto:${supportEmail}`} className="text-[#66c0f4] hover:text-white hover:underline">
                {supportEmail}
              </a>
            </p>
            <Socials socialLinks={socialData?.socialLinks || []} path={pathname} />

            {/* Facebook Group Button */}
            <div className="mt-auto w-fit">
              <FacebookGroupButton
                socialData={socialData}
                path={pathname}
                variant="primary"
                taglinePlacement="inside"
                className="text-sm items-center"
              />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="section-label mb-4 text-neutral-50">Navigate</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/vendors"
                  className={`transition-colors ${
                    pathname === "/vendors" ? "font-medium text-white" : "text-neutral-150 hover:text-neutral-50"
                  }`}>
                  Vendors
                </Link>
              </li>
              {footerLinks &&
                footerLinks.map((link, i) => {
                  let isActive = false;
                  const slug =
                    link.slug?.current && !link.slug.current.startsWith("/")
                      ? "/" + link.slug.current
                      : link.slug?.current;
                  const href = link.external ? link.url : slug;
                  if (!link.external && pathname === href) isActive = true;

                  return (
                    <li key={i}>
                      <Link
                        href={href || "/"}
                        className={`transition-colors ${
                          isActive ? "font-medium text-white" : "text-neutral-150 hover:text-neutral-50"
                        }`}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noreferrer" : undefined}>
                        {link.title}
                      </Link>
                    </li>
                  );
                })}
            </ul>

            {shouldShowTrustpilot && trustpilotUrl && (
              <div className="mt-6">
                <TrustpilotReviewWidget reviewUrl={trustpilotUrl} />
              </div>
            )}
          </div>

          {/* Trust */}
          <div>
            <h4 className="section-label mb-4 text-neutral-50">Trust</h4>
            <ul className="mb-6 space-y-2">
              {TRUST_FOOTER_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`transition-colors ${
                      pathname === href ? "font-medium text-white" : "text-neutral-150 hover:text-neutral-50"
                    }`}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contribute Section */}
          <div className="xs:col-span-2 xl:col-span-1">
            <h4 className="section-label mb-4 text-neutral-50">Contribute</h4>
            <div className="space-y-3">
              {/* Suggest a Key Button */}
              <ContactModalTrigger
                tab="suggest"
                className="group w-full cursor-pointer rounded-sm border border-[#4a90c4] bg-[#1a3a5c] p-2 font-semibold text-[#c6d4df] transition-colors duration-200 hover:border-[#66c0f4] hover:bg-[#213246]">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#213246]">
                    <FaKey className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-bold text-neutral-50">Suggest a Key</div>
                    <div className="text-xs text-neutral-200">Share free CD keys</div>
                  </div>
                  <FaChevronRight className="w-4 h-4 opacity-75" />
                </div>
              </ContactModalTrigger>

              {/* Contact Us Button */}
              <ContactModalTrigger
                tab="contact"
                className="group w-full cursor-pointer rounded-sm border border-[#2a475e] bg-[#1b2838] px-4 py-3 font-medium text-neutral-50 transition-colors duration-200 hover:border-[#4a90c4] hover:bg-[#213246]">
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="w-5 h-5 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold">Contact Us</div>
                  </div>
                </div>
              </ContactModalTrigger>
            </div>

            <div className="mt-6 border-t border-[#2a475e] pt-6">
              <FooterMiniSocialShare siteBaseUrl={siteBaseUrl} />

              {hasSupportLinks ? (
                <>
                  <p className="mb-3 mt-6 text-xs">Support the Project</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {buyMeACoffeeUrl ? (
                        <Link
                          href={buyMeACoffeeUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            trackEvent("social_click", {
                              social: "buymeacoffee",
                              path: window.location.pathname
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-sm bg-[#7d3315] px-3 py-2 text-xs font-semibold text-neutral-50 transition-colors hover:bg-[#a3421b] hover:text-white">
                          🥕 Carrot Juice
                        </Link>
                      ) : null}
                      {githubRepoUrl ? (
                        <Link
                          href={githubRepoUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open KeyAway source code on GitHub"
                          title="KeyAway repository on GitHub"
                          onClick={() => {
                            trackEvent("social_click", {
                              social: "github keyaway",
                              path: window.location.pathname
                            });
                          }}
                          className="inline-flex items-center gap-2 rounded-sm bg-[#213246] px-3 py-2 text-xs font-semibold text-neutral-50 hover:text-white transition-colors hover:bg-[#2a475e]">
                          ⭐ KeyAway repo
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-[#2a475e] pt-8 sm:flex-row">
          <p className="text-sm text-[#8f98a0]">
            © {currentYear} {storeData.title}. All rights reserved.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 sm:mt-0 sm:justify-end">
            <Link href="/about" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              About
            </Link>
            <Link href="/how-it-works" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              How it works
            </Link>
            <Link href="/privacy" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              Terms
            </Link>
            <a
              href="/llms.txt"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              llms.txt
            </a>
          </div>
        </div>
      </div>

      {/* Contact Modal - defaults to suggest tab */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} defaultTab="suggest" />
    </footer>
  );
}
