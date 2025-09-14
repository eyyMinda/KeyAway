"use client";

import { StoreDetails, SanityLink, LogoData, SocialData } from "@/src/types";
import Link from "next/link";
import { IdealImageClient } from "../general/IdealImageClient";
import { usePathname } from "next/navigation";
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter, FaYoutube, FaGlobe } from "react-icons/fa";
import { trackEvent } from "@/src/lib/trackEvent";

interface FooterProps {
  storeData: StoreDetails;
  logoData: LogoData;
  socialData: SocialData;
}

export default function Footer({ storeData, logoData, socialData }: FooterProps) {
  const pathname = usePathname();
  const footer = storeData?.footer;
  let isLogo = false;
  let footerLinks: SanityLink[] = [];
  if (footer && (footer.footerLinks || footer.isLogo)) {
    if (storeData.logo) isLogo = footer.isLogo;
    footerLinks = footer.footerLinks || [];
  }

  const currentYear = new Date().getFullYear();

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "github":
        return FaGithub;
      case "linkedin":
        return FaLinkedin;
      case "instagram":
        return FaInstagram;
      case "twitter":
        return FaTwitter;
      case "youtube":
        return FaYoutube;
      case "website":
      case "portfolio":
        return FaGlobe;
      default:
        return FaGlobe;
    }
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-block mb-4">
              {isLogo ? (
                <IdealImageClient {...logoData} className="h-12 w-auto" />
              ) : (
                <h3 className="text-2xl font-bold text-white">{storeData.title}</h3>
              )}
            </Link>
            <p className="text-gray-300 mb-6 max-w-md">
              {storeData.description || "Free Giveaway CD Keys for your favorite games and software."}
            </p>
            <div className="flex space-x-4">
              {socialData?.socialLinks?.map((social, index) => {
                const IconComponent = getSocialIcon(social.platform);
                return (
                  <Link
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      console.log(
                        "social_click",
                        window.location.pathname.split("/").filter(Boolean).pop(),
                        social.platform,
                        window.location.pathname
                      );
                      trackEvent("social_click", {
                        social: social.platform,
                        path: window.location.pathname
                      });
                    }}
                    className="text-gray-300 hover:text-primary-500 transition-colors"
                    title={social.platform}>
                    <span className="sr-only">{social.platform}</span>
                    <IconComponent className="h-6 w-6" />
                  </Link>
                );
              })}
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
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Support & Follow</h4>
            <div className="flex flex-wrap gap-3">
              {/* Carrot Juice Support */}
              <Link
                href="https://www.buymeacoffee.com/eyyMinda"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackEvent("social_click", {
                    social: "buymeacoffee",
                    path: window.location.pathname
                  });
                }}
                className="group bg-orange-500 hover:bg-orange-600 text-white px-3 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg border border-orange-400">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg flex-shrink-0">🥕</span>
                  <div className="text-center min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">Buy Carrot Juice</div>
                  </div>
                </div>
              </Link>

              {/* GitHub Star */}
              <Link
                href="https://github.com/eyyMinda/keyaway"
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  trackEvent("social_click", {
                    social: "github keyaway",
                    path: window.location.pathname
                  });
                }}
                className="group bg-gray-600 hover:bg-gray-700 text-white px-3 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg border border-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg flex-shrink-0">⭐</span>
                  <div className="text-center min-w-0">
                    <div className="text-sm font-bold whitespace-nowrap">Star on GitHub</div>
                  </div>
                </div>
              </Link>
            </div>
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
    </footer>
  );
}
