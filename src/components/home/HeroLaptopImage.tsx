"use client";

import Image from "next/image";
import heroAsset from "@/public/images/Hero_laptop_software_icons.webp";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";

const HERO_ALT = "Laptop with software icons—browse verified programs and CD keys on KeyAway" as const;

export default function HeroLaptopImage({ sizes, priority = true }: { sizes: string; priority?: boolean }) {
  const scrollToPrograms = () => {
    scrollToSectionWithHeaderOffset("#popular-programs");
  };

  const shellClass =
    "group relative w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400";

  const imageProps = {
    src: heroAsset,
    alt: HERO_ALT,
    sizes,
    placeholder: "blur" as const,
    priority,
    ...(priority ? { fetchPriority: "high" as const } : {}),
    quality: 75 as const
  };

  return (
    <div
      className={shellClass}
      role="button"
      tabIndex={0}
      onClick={scrollToPrograms}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          scrollToPrograms();
        }
      }}
      aria-label="Scroll to programs">
      <div className="relative aspect-2/1 w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 lg:aspect-3/2 lg:rounded-3xl">
        <Image
          {...imageProps}
          fill
          className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
    </div>
  );
}
