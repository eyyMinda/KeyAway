"use client";

import Link from "next/link";
import { SanityLink } from "@/src/types/global";

interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ headerLinks, isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white shadow-md px-4 pt-2 pb-4 space-y-2">
      {headerLinks &&
        headerLinks.map((link, i) =>
          link.external ? (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="block hover:text-blue-600"
              onClick={() => onClose()}>
              {link.title}
            </a>
          ) : (
            <Link
              key={i}
              href={`/program/${link.slug?.current}`}
              className="block hover:text-blue-600"
              onClick={() => onClose()}>
              {link.title}
            </Link>
          )
        )}
    </div>
  );
}
