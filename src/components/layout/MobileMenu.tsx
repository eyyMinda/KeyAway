"use client";

import Link from "next/link";
import { SanityLink, SocialData } from "@/src/types";
import AdminNavIcons from "@components/layout/AdminNavIcons";
import { usePathname } from "next/navigation";
import { FacebookGroupButton } from "@/src/components/social";
import { ContactModalTrigger } from "@/src/components/contact";
import { FaEnvelope } from "react-icons/fa";
import { useEffect } from "react";

interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
  socialData?: SocialData;
}

export default function MobileMenu({ headerLinks, isOpen, onClose, socialData }: MobileMenuProps) {
  const pathname = usePathname();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Dimmed Background */}
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden cursor-pointer" onClick={onClose} />

      {/* Mobile Menu */}
      <div className="fixed top-0 right-0 h-full w-full max-w-[540px] bg-gray-900 shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out cursor-default">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Menu</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 cursor-default">
            {/* Navigation Links */}
            <div className="space-y-2">
              {headerLinks &&
                headerLinks.map((link, i) => {
                  let isActive = false;
                  const slug =
                    link.slug?.current && !link.slug.current.startsWith("/")
                      ? "/" + link.slug.current
                      : link.slug?.current;
                  const href = link.external ? link.url : slug;
                  if (!link.external && pathname === href) isActive = true;

                  return (
                    <Link
                      key={i}
                      href={href || "/"}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className={`block px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ${
                        isActive ? "text-white bg-gray-800" : "text-gray-300"
                      }`}
                      onClick={() => onClose()}>
                      {link.title}
                    </Link>
                  );
                })}
            </div>

            {/* Contact Button */}
            <div className="pt-4 border-t border-gray-700">
              <div
                className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                onClick={onClose}>
                <ContactModalTrigger tab="contact" className="flex items-center gap-3 w-full">
                  <FaEnvelope className="w-4 h-4" />
                  <span>Contact Us</span>
                </ContactModalTrigger>
              </div>
            </div>

            {/* Facebook Group Button */}
            <div className="pt-4 border-t border-gray-700">
              <FacebookGroupButton
                socialData={socialData}
                path={pathname}
                variant="outline"
                className="text-sm w-full"
              />
            </div>

            {/* Admin Navigation */}
            <div className="pt-4 border-t border-gray-700">
              <AdminNavIcons />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
