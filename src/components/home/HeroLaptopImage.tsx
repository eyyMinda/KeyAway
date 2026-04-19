"use client";

import Image from "next/image";

/** Source asset: `public/images/Hero_laptop_software_icons.webp` (1536×1024). */
const HERO_IMAGE = {
  src: "/images/Hero_laptop_software_icons.webp",
  width: 1536,
  height: 1024
} as const;

export type HeroLaptopImageVariant = "mobile" | "desktop";

export default function HeroLaptopImage({
  sizes,
  variant,
  priority = true
}: {
  sizes: string;
  variant: HeroLaptopImageVariant;
  priority?: boolean;
}) {
  const scrollToPrograms = () => {
    document.querySelector("#popular-programs")?.scrollIntoView({ behavior: "smooth" });
  };

  const shellClass =
    "group relative w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400";

  const sharedImageProps = {
    src: HERO_IMAGE.src,
    alt: "Laptop with software icons—browse verified programs and CD keys on KeyAway" as const,
    sizes,
    priority,
    fetchPriority: "high" as const,
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
      {variant === "mobile" ? (
        <div className="relative aspect-2/1 w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10">
          <Image
            {...sharedImageProps}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <Image
          {...sharedImageProps}
          width={HERO_IMAGE.width}
          height={HERO_IMAGE.height}
          className="h-auto w-full rounded-3xl object-cover shadow-2xl ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
    </div>
  );
}
