"use client";

import Link from "next/link";
import { SanityLink, SocialData } from "@/src/types";
import AdminNavIcons from "@components/layout/AdminNavIcons";
import { usePathname } from "next/navigation";
import { FacebookGroupButton } from "@/src/components/social";
import { ContactModalTrigger } from "@/src/components/contact";
import { FaEnvelope } from "react-icons/fa";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const PANEL_MS = 300;

interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
  socialData?: SocialData;
}

export default function MobileMenu({ headerLinks, isOpen, onClose, socialData }: MobileMenuProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [portalVisible, setPortalVisible] = useState(false);
  const [panelIn, setPanelIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPortalVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !portalVisible) return;
    const t = setTimeout(() => setPortalVisible(false), PANEL_MS);
    return () => clearTimeout(t);
  }, [isOpen, portalVisible]);

  useLayoutEffect(() => {
    if (!portalVisible || !isOpen) {
      setPanelIn(false);
      return;
    }
    setPanelIn(false);
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setPanelIn(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [portalVisible, isOpen]);

  useEffect(() => {
    if (portalVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [portalVisible]);

  if (!mounted || !portalVisible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-110 cursor-pointer overflow-y-auto bg-black/60 px-4 pb-4 pt-4 md:hidden"
      onClick={onClose}>
      <div
        className={`mx-auto w-full max-w-[540px] cursor-default transition-transform duration-300 ease-out will-change-transform ${
          panelIn && isOpen ? "translate-y-0" : "-translate-y-full"
        }`}
        onClick={e => e.stopPropagation()}>
        <div className="flex max-h-[min(90vh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-sm border border-[#2a475e] bg-[#16202d] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#2a475e] p-4">
            <h3 className="section-label text-[#c6d4df]!">Menu</h3>
            <button onClick={onClose} className="cursor-pointer text-[#8f98a0] transition-colors hover:text-[#c6d4df]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 cursor-default space-y-6 overflow-y-auto p-4">
            <div className="space-y-2">
              {headerLinks &&
                headerLinks.map((link, i) => {
                  let isActive = false;
                  const raw = link.slug?.current;
                  const slug = raw && !raw.startsWith("/") ? `/${raw}` : raw;
                  const href = link.external ? link.url : slug;
                  if (!link.external && pathname === href) isActive = true;

                  return (
                    <Link
                      key={i}
                      href={href || "/"}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className={`block cursor-pointer rounded-sm border-l-2 px-3 py-2 transition-colors ${
                        isActive
                          ? "border-[#66c0f4] bg-[#213246] text-white"
                          : "border-transparent text-[#8f98a0] hover:bg-[#213246] hover:text-white"
                      }`}
                      onClick={onClose}>
                      {link.title}
                    </Link>
                  );
                })}
            </div>

            <div className="border-t border-[#2a475e] pt-4">
              <div
                className="flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-[#8f98a0] transition-colors hover:bg-[#213246] hover:text-white"
                onClick={onClose}>
                <ContactModalTrigger tab="contact" className="flex w-full items-center gap-3">
                  <FaEnvelope className="h-4 w-4" />
                  <span>Contact Us</span>
                </ContactModalTrigger>
              </div>
            </div>

            <AdminNavIcons mobileLayout />
          </div>

          <div className="border-t border-[#2a475e] p-4">
            <FacebookGroupButton
              socialData={socialData}
              path={pathname}
              variant="outline"
              taglinePlacement="inside"
              className="w-full text-sm"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
