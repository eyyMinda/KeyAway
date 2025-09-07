"use client";

import { StoreDetails, SanityLink, LogoData, SocialData } from "@/src/types/global";
import Link from "next/link";
import { IdealImageClient } from "./IdealImageClient";
import { usePathname } from "next/navigation";
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter, FaYoutube, FaGlobe } from "react-icons/fa";

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <div className="space-y-4">
              <Link
                href="https://www.buymeacoffee.com/eyyMinda"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors">
                <span className="mr-2">🥕</span>
                Buy Me Carrot Juice
              </Link>
              <p className="text-sm text-gray-300">Help keep this project running</p>
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
