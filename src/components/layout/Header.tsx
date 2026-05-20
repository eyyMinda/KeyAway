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
import { SanityLink } from "@/src/types";
import type { HeaderProps } from "@/src/types/layout";
import type { Notification } from "@/src/types/notifications";
import { useStoreDetails } from "@components/providers/StoreDetailsProvider";
import { usePathname } from "next/navigation";
export default function Header({ logoData, notifications: notificationsProp, socialData }: HeaderProps) {
  const storeData = useStoreDetails();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>(notificationsProp ?? []);

  useEffect(() => {
    if (notificationsProp !== undefined) {
      setNotifications(notificationsProp);
      return;
    }
    let cancelled = false;
    void fetch("/api/v1/notifications/recent")
      .then(r => r.json())
      .then((body: { data?: { notifications?: Notification[] } }) => {
        const list = body?.data?.notifications ?? [];
        if (!cancelled) setNotifications(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [notificationsProp]);
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
    <header
      className={`sticky top-0 z-101 border-b border-[#2a475e] bg-[#0E141B] backdrop-blur max-md:transition-transform max-md:duration-300 max-md:ease-out ${
        isOpen ? "max-md:pointer-events-none max-md:-translate-y-full" : "max-md:translate-y-0"
      }`}>
      <div className="mx-auto flex h-18 w-full max-w-360 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          title={storeData.title}
          className="flex items-center text-xl font-bold text-[#c6d4df] transition-colors hover:text-[#66c0f4]">
          {isLogo ? (
            <IdealImageClient {...logoData} priority className="max-w-3xs max-h-10 xs:max-h-12 w-auto h-auto" />
          ) : (
            <span className="text-xl font-bold text-[#c6d4df] transition-colors hover:text-[#66c0f4]">
              {storeData.title || "KeyAway"}
            </span>
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex flex-wrap justify-end gap-6 gap-y-0.5">
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
                    className={`px-0.5 py-0.5 transition-colors font-semibold ${
                      isActive ? "font-bold text-[#66c0f4]" : "text-white hover:text-[#aae0ff]"
                    }`}
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
            className="flex cursor-pointer items-center gap-2 rounded-sm border border-[#2a475e] px-3 py-1.5 text-[#8f98a0] transition-colors hover:border-[#4a90c4] hover:text-[#66c0f4]"
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
            className="cursor-pointer p-2 text-[#8f98a0] transition-colors hover:text-[#66c0f4]"
            aria-label="Contact us">
            <FaEnvelope className="w-5 h-5" />
          </ContactModalTrigger>
          <AnnouncementNotifications notifications={notifications} socialData={socialData} />
          <button
            type="button"
            className="cursor-pointer text-[#8f98a0] transition-colors hover:text-[#66c0f4] focus:outline-none"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <HiX size={24} aria-hidden /> : <HiMenu size={24} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu headerLinks={headerLinks} isOpen={isOpen} onClose={() => setIsOpen(false)} socialData={socialData} />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        defaultTab={contactModalTab}
      />
    </header>
  );
}
