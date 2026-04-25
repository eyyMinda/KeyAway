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
    <footer className="bg-linear-to-b from-gray-900 via-gray-800 to-gray-900 text-white mt-auto">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="inline-block">
              {isLogo ? (
                <IdealImageClient {...logoData} className="h-12 w-auto" />
              ) : (
                <h3 className="text-2xl font-bold text-white">{storeData.title}</h3>
              )}
            </Link>
            <p className="text-gray-300 max-w-md mb-2">
              {portableTextToPlainText(storeData.description) ||
                "Free Giveaway CD Keys for your favorite games and software."}
            </p>
            <Socials socialLinks={socialData?.socialLinks || []} path={pathname} />

            {/* Facebook Group Button */}
            <div className="mt-auto w-fit">
              <FacebookGroupButton
                socialData={socialData}
                path={pathname}
                variant="outline"
                className="text-sm items-center"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
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
                        className={`text-gray-300 hover:text-primary-500 transition-colors ${
                          isActive ? "text-white font-medium" : ""
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
            <h4 className="text-lg font-semibold mb-4">Contribute</h4>
            <div className="space-y-3">
              {/* Suggest a Key Button */}
              <ContactModalTrigger
                tab="suggest"
                className="group w-full bg-linear-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl border-2 border-primary-400/30 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FaKey className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="text-sm font-bold">Suggest a Key</div>
                    <div className="text-xs text-primary-100 opacity-90">Share free CD keys</div>
                  </div>
                  <FaChevronRight className="w-4 h-4 opacity-75" />
                </div>
              </ContactModalTrigger>

              {/* Contact Us Button */}
              <ContactModalTrigger
                tab="contact"
                className="group w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg border border-gray-600/50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="w-5 h-5 shrink-0" />
                  <div className="text-left flex-1">
                    <div className="text-sm font-semibold">Contact Us</div>
                  </div>
                </div>
              </ContactModalTrigger>
            </div>

            {hasSupportLinks ? (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-3">Support the Project</p>
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
                        className="inline-flex items-center gap-2 bg-orange-700 hover:bg-orange-800 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                        🥕 Carrot Juice
                      </Link>
                    ) : null}
                    {githubRepoUrl ? (
                      <Link
                        href={githubRepoUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => {
                          trackEvent("social_click", {
                            social: "github keyaway",
                            path: window.location.pathname
                          });
                        }}
                        className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
                        ⭐ GitHub
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            © {currentYear} {storeData.title}. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <Link href="/privacy" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-300 hover:text-primary-500 text-sm transition-colors">
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
