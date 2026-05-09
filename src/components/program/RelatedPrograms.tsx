"use client";

import { useState, useLayoutEffect, useMemo } from "react";
import Link from "next/link";
import { FaChevronLeft, FaChevronRight, FaDesktop } from "react-icons/fa";
import { IdealImage } from "@/src/components/general/IdealImage";
import { Program } from "@/src/types";

interface RelatedProgramsProps {
  programs: Program[];
}

/** Match Tailwind `sm` (640) and `lg` (1024). */
function readItemsPerView(): number {
  if (typeof window === "undefined") return 1;
  const w = window.innerWidth;
  if (w >= 1024) return 3;
  if (w >= 640) return 2;
  return 1;
}

/**
 * Start indices for each carousel "page" so the last view always shows the last `k`
 * programs together (when n > k), instead of a single widened tail tile.
 * e.g. n=7,k=3 → [0,3,4] → views [1–3],[4–6],[5–7].
 */
function computePageStarts(programCount: number, k: number): number[] {
  const n = programCount;
  if (n === 0) return [];
  if (k < 1) return [0];
  if (n <= k) return [0];

  const starts: number[] = [];
  for (let s = 0; s <= n - k; s += k) {
    starts.push(s);
  }
  const lastStart = n - k;
  if (starts[starts.length - 1] !== lastStart) {
    starts.push(lastStart);
  }
  return starts;
}

/** Four-pane mark (Windows-style tile) for store-row footer. */
function WindowsGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M0 2.3L6.8 1.3v6.4H0V2.3zm7.6-.9L16 0v8H7.6V1.4zM0 9.3h6.8V16L0 14.9V9.3zm7.6.1H16V16l-8.4-1.2V9.4z"
      />
    </svg>
  );
}

const navBtn =
  "flex shrink-0 cursor-pointer items-center justify-center self-center border-0 bg-transparent p-2 text-xl leading-none text-[#8fa3b8] transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1D2634] disabled:cursor-pointer disabled:opacity-35 sm:p-2.5 sm:text-2xl";

const seeMoreBtn =
  "inline-flex cursor-pointer items-center justify-center rounded border border-[#5a6a7e] bg-transparent px-4 py-2 text-sm font-medium text-[#9eb0c4] transition-colors hover:border-[#7d8fa3] hover:bg-white/[0.04] hover:text-[#dce4ee] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202B3B]";

const paginationBtn =
  "flex min-h-11 min-w-9 cursor-pointer items-center justify-center rounded-sm py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#66c0f4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#202B3B]";

function ProgramTile({ program }: { program: Program }) {
  return (
    <Link href={`/program/${program.slug.current}`} className="group block h-full min-w-0 cursor-pointer">
      <article className="flex h-full flex-col gap-3 overflow-hidden rounded-sm bg-[#0E141B] ring-1 ring-black/25 transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] p-4">
        <div className="relative aspect-video overflow-hidden rounded-sm">
          {program.image ? (
            <IdealImage
              image={program.image}
              alt={program.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#4a5568]">
              <FaDesktop className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden />
            </div>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-white">{program.title}</h3>

        <div className="flex items-center gap-2">
          <WindowsGlyph className="h-3.5 w-3.5 shrink-0 text-[#7a8799] sm:h-4 sm:w-4" />
          <span className="grow text-sm text-[#8b9aad]">Free</span>
          <span className="shrink-0 rounded-sm bg-[#bef571] px-3 py-1.5 text-center text-xs font-bold text-black sm:px-3.5 sm:text-sm">
            Get keys
          </span>
        </div>
      </article>
    </Link>
  );
}

export default function RelatedPrograms({ programs }: RelatedProgramsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);

  useLayoutEffect(() => {
    const update = () => setItemsPerView(readItemsPerView());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageStarts = useMemo(() => computePageStarts(programs.length, itemsPerView), [programs.length, itemsPerView]);

  const numPages = pageStarts.length;
  const maxPage = Math.max(0, numPages - 1);

  useLayoutEffect(() => {
    setCurrentIndex(i => Math.min(i, maxPage));
  }, [maxPage]);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxPage));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (programs.length === 0) return null;

  const showNav = numPages > 1;

  return (
    <section className="overflow-hidden border-t border-[#2d3d52] bg-[#202B3B] py-8 sm:py-10">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex w-full items-end justify-between lg:mb-8">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="section-label">You Might Also Like</div>
            <h2 className="section-title tracking-tight">
              Related <span className="text-gradient-pro">Programs</span>
            </h2>
            <p className="max-w-2xl text-sm text-[#9eb0c4] sm:text-base">
              Discover more premium software with free CD keys
            </p>
          </div>

          <Link href="/programs" className={`${seeMoreBtn} shrink-0`}>
            See more
          </Link>
        </div>

        <div className="rounded-sm bg-[#1D2634] px-2 py-4 lg:py-6">
          <div className="flex items-center gap-1 sm:gap-2">
            {showNav ? (
              <button
                type="button"
                aria-label="Previous related programs"
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className={navBtn}>
                <FaChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </button>
            ) : null}

            <div className="min-w-0 flex-1 overflow-hidden rounded-sm">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  width: `${numPages * 100}%`,
                  transform: `translateX(-${(100 / numPages) * currentIndex}%)`
                }}>
                {pageStarts.map(start => (
                  <div
                    key={start}
                    className="flex shrink-0 gap-2 px-0.5 sm:gap-3 sm:px-1"
                    style={{ width: `${100 / numPages}%` }}>
                    {programs.slice(start, start + itemsPerView).map(program => (
                      <div key={program.slug.current} className="min-w-0 flex-1">
                        <ProgramTile program={program} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {showNav ? (
              <button
                type="button"
                aria-label="Next related programs"
                onClick={nextSlide}
                disabled={currentIndex >= maxPage}
                className={navBtn}>
                <FaChevronRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {showNav ? (
          <div className="mt-4 flex justify-center gap-0.5 sm:gap-1 sm:mt-5">
            {pageStarts.map((_, index) => (
              <button
                key={pageStarts[index]}
                type="button"
                aria-label={`Show related programs page ${index + 1} of ${numPages}`}
                aria-current={index === currentIndex ? "true" : undefined}
                onClick={() => setCurrentIndex(index)}
                className={paginationBtn}>
                <span
                  className={`block h-2 rounded-sm transition-all duration-200 ${
                    index === currentIndex ? "w-9 bg-[#8ebff5] sm:w-10" : "w-6 bg-[#0E141B] hover:bg-[#4d5f78] sm:w-7"
                  }`}
                  aria-hidden
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
