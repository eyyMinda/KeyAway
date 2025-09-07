"use client";

import Link from "next/link";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import MobileMenu from "./MobileMenu";
import { IdealImageClient } from "./IdealImageClient";
import { StoreDetails, SanityLink, LogoData } from "@/src/types/global";

interface HeaderProps {
  storeData: StoreDetails;
  logoData: LogoData;
}

export default function Header({ storeData, logoData }: HeaderProps) {
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
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {isLogo ? (
          <Link href="/" title={storeData.title} className="flex items-center">
            <span className="sr-only">{storeData.title}</span>
            <IdealImageClient {...logoData} />
          </Link>
        ) : (
          <Link href="/" className="text-xl font-bold text-gray-800">
            {storeData.title || "KeyAway"}
          </Link>
        )}
        {/* Desktop Links */}
        <nav className="hidden md:flex space-x-6">
          {headerLinks &&
            headerLinks.map((link, i) =>
              link.external ? (
                <a key={i} href={link.url} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                  {link.title}
                </a>
              ) : (
                <Link key={i} href={`/program/${link.slug?.current}`} className="hover:text-blue-600">
                  {link.title}
                </Link>
              )
            )}
        </nav>
        {/* Mobile Burger Button */}
        <button className="md:hidden focus:outline-none" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu headerLinks={headerLinks} isOpen={isOpen} onClose={toggleMenu} />
    </header>
  );
}
