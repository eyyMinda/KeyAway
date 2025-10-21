"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { FaEnvelope } from "react-icons/fa";
import MobileMenu from "@components/layout/MobileMenu";
import AdminNavIcons from "@components/layout/AdminNavIcons";
import AnnouncementNotifications from "@components/layout/AnnouncementNotifications";
import { ContactModal, ContactModalTrigger } from "@/src/components/contact";
import { IdealImageClient } from "@/src/components/general/IdealImageClient";
import { StoreDetails, SanityLink, LogoData, SocialData } from "@/src/types";
import { Notification } from "@/src/types/notifications";
import { usePathname } from "next/navigation";

interface HeaderProps {
  storeData: StoreDetails;
  logoData: LogoData;
  notifications: Notification[];
  socialData?: SocialData;
}

export default function Header({ storeData, logoData, notifications, socialData }: HeaderProps) {
  const pathname = usePathname();
  const header = storeData?.header;
  let isLogo = false;
  let headerLinks: SanityLink[] = [];
  if (header && (header.headerLinks || header.isLogo)) {
    if (storeData.logo) isLogo = header.isLogo;
    headerLinks = header.headerLinks || [];
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalTab, setContactModalTab] = useState<"contact" | "suggest">("contact");
  const toggleMenu = () => setIsOpen(!isOpen);

  // Listen for custom events to open modal
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: "contact" | "suggest" }>;
      setContactModalTab(customEvent.detail.tab);
      setIsContactModalOpen(true);
    };

    window.addEventListener("openContactModal", handleOpenModal);
    return () => window.removeEventListener("openContactModal", handleOpenModal);
  }, []);

  return (
    <header className="bg-gray-900 shadow-lg sticky top-0 z-[101]">
      <div className="max-w-[90rem] mx-auto p-4 sm:px-6 lg:px-8 flex items-center justify-between max-h-20">
        <Link
          href="/"
          title={storeData.title}
          className="flex items-center text-xl font-bold text-gray-300 hover:text-primary-500 transition-colors">
          {isLogo ? (
            <>
              <span className="sr-only">{storeData.title}</span>
              <IdealImageClient {...logoData} className="max-w-3xs max-h-10 xs:max-h-12 w-auto h-auto" />
            </>
          ) : (
            <span className="text-xl font-bold text-gray-300 hover:text-primary-500 transition-colors">
              {storeData.title || "KeyAway"}
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex flex-wrap justify-end gap-6 gap-y-2">
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
                    className={`hover:text-primary-500 transition-colors ${isActive ? "text-white font-medium" : "text-gray-300"}`}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}>
                    {link.title}
                  </Link>
                );
              })}
          </nav>

          {/* Contact Button */}
          <ContactModalTrigger
            tab="contact"
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-primary-500 transition-colors cursor-pointer"
            aria-label="Contact us">
            <FaEnvelope className="w-4 h-4" />
            <span className="text-sm font-medium">Contact</span>
          </ContactModalTrigger>

          {/* Announcement Notifications */}
          <AnnouncementNotifications notifications={notifications} socialData={socialData} />

          {/* Admin Navigation Icons */}
          <AdminNavIcons />
        </div>

        {/* Mobile: Contact + Notification Bell + Burger Menu */}
        <div className="md:hidden flex items-center gap-2">
          <ContactModalTrigger
            tab="contact"
            className="p-2 text-gray-300 hover:text-primary-500 transition-colors cursor-pointer"
            aria-label="Contact us">
            <FaEnvelope className="w-5 h-5" />
          </ContactModalTrigger>
          <AnnouncementNotifications notifications={notifications} />
          <button
            className="focus:outline-none text-gray-300 hover:text-primary-500 transition-colors cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu headerLinks={headerLinks} isOpen={isOpen} onClose={toggleMenu} socialData={socialData} />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        defaultTab={contactModalTab}
      />
    </header>
  );
}
