"use client";

import Link from "next/link";
import { SanityLink } from "@/src/types/global";

interface MobileMenuProps {
  headerLinks?: SanityLink[];
  isOpen: boolean;
  onClose: () => void;
}

import { usePathname } from "next/navigation";

export default function MobileMenu({ headerLinks, isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-gray-800 shadow-md px-4 pt-2 pb-4 space-y-2">
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
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
              className={`block hover:text-primary-500 ${isActive ? "text-white" : "text-gray-300"}`}
              onClick={() => onClose()}>
              {link.title}
            </Link>
          );
        })}
    </div>
  );
}
