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
import { trackEvent } from "@/src/lib/analytics/trackEvent";
import TrustpilotReviewWidget from "@/src/components/trustpilot/TrustpilotReviewWidget";
import { getTrustpilotReviewUrl } from "@/src/lib/social/socialUtils";

export default function Footer({ logoData, socialData }: FooterProps) {
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

  const ol = storeData?.otherLinks;
  const buyMeACoffeeUrl = ol?.find(e => e.kind === "buymeacoffee" && e.url?.trim())?.url?.trim() ?? null;
  const githubRepoUrl = ol?.find(e => e.kind === "githubRepository" && e.url?.trim())?.url?.trim() ?? null;
  const hasSupportLinks = Boolean(buyMeACoffeeUrl || githubRepoUrl);

  return (
    <footer className="mt-auto border-t border-[#2a475e] bg-[#16202d] text-[#c6d4df]">
      <div className="mx-auto w-full max-w-360 px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-block">
              {isLogo ? (
                <IdealImageClient {...logoData} className="h-12 w-auto" />
              ) : (
                <h3 className="text-2xl font-bold text-[#c6d4df]">{storeData.title}</h3>
              )}
            </Link>
            <p className="mb-2 max-w-md text-[#8f98a0]">
              {portableTextToPlainText(storeData.description) ||
                "Free Giveaway CD Keys for your favorite games and software."}
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

          {/* Navigation Links */}
          <div>
            <h4 className="section-label mb-4 text-[#c6d4df]!">Navigate</h4>
            <ul className="space-y-2">
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
                          isActive ? "font-medium text-[#c6d4df]" : "text-[#8f98a0] hover:text-white"
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

          {/* Contribute Section */}
          <div>
            <h4 className="section-label mb-4 text-[#c6d4df]!">Contribute</h4>
            <div className="space-y-3">
              {/* Suggest a Key Button */}
              <ContactModalTrigger
                tab="suggest"
                className="group w-full cursor-pointer rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-4 py-4 font-semibold text-[#c6d4df] transition-colors duration-200 hover:border-[#66c0f4] hover:bg-[#213246]">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#213246]">
                    <FaKey className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-bold">Suggest a Key</div>
                    <div className="text-xs text-[#8f98a0]">Share free CD keys</div>
                  </div>
                  <FaChevronRight className="w-4 h-4 opacity-75" />
                </div>
              </ContactModalTrigger>

              {/* Contact Us Button */}
              <ContactModalTrigger
                tab="contact"
                className="group w-full cursor-pointer rounded-sm border border-[#2a475e] bg-[#1b2838] px-4 py-3 font-medium text-[#c6d4df] transition-colors duration-200 hover:border-[#4a90c4] hover:bg-[#213246]">
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="w-5 h-5 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold">Contact Us</div>
                  </div>
                </div>
              </ContactModalTrigger>
            </div>

            {hasSupportLinks ? (
              <div className="mt-6 border-t border-[#2a475e] pt-6">
                <p className="mb-3 text-xs text-[#8f98a0]">Support the Project</p>
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
                        className="inline-flex items-center gap-2 rounded-sm bg-[#7d3315] px-3 py-2 text-xs font-semibold text-[#c6d4df] transition-colors hover:bg-[#a3421b] hover:text-white">
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
                        className="inline-flex items-center gap-2 rounded-sm bg-[#213246] px-3 py-2 text-xs font-semibold text-[#c6d4df] transition-colors hover:bg-[#2a475e]">
                        ⭐ KeyAway repo
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-[#2a475e] pt-8 sm:flex-row">
          <p className="text-sm text-[#8f98a0]">
            © {currentYear} {storeData.title}. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-[#8f98a0] transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Modal - defaults to suggest tab */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} defaultTab="suggest" />
    </footer>
  );
}
