"use client";

import Link from "next/link";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import MobileMenu from "@components/layout/MobileMenu";
import { IdealImageClient } from "@/src/components/general/IdealImageClient";
import { StoreDetails, SanityLink, LogoData } from "@/src/types/global";
import { usePathname } from "next/navigation";

interface HeaderProps {
  storeData: StoreDetails;
  logoData: LogoData;
}

export default function Header({ storeData, logoData }: HeaderProps) {
  const pathname = usePathname();
  const header = storeData?.header;
  let isLogo = false;
  let headerLinks: SanityLink[] = [];
  if (header && (header.headerLinks || header.isLogo)) {
    if (storeData.logo) isLogo = header.isLogo;
    headerLinks = header.headerLinks || [];
  }
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className="bg-gray-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 flex items-center justify-between max-h-20">
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
        <nav className="hidden md:flex space-x-6">
          {headerLinks &&
            headerLinks.map((link, i) => {
              let isActive = false;
              const slug =
                link.slug?.current && !link.slug.current.startsWith("/") ? "/" + link.slug.current : link.slug?.current;
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
        {/* Mobile Burger Button */}
        <button
          className="md:hidden focus:outline-none text-gray-300 hover:text-primary-500 transition-colors cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu headerLinks={headerLinks} isOpen={isOpen} onClose={toggleMenu} />
    </header>
  );
}
