/** Reserve space for the sticky header when scrolling to in-page sections. */
const HEADER_SCROLL_OFFSET_PX = 72;

/**
 * Smooth-scroll so `target` (CSS selector, e.g. `#programs-grid`) sits below the sticky header.
 */
export function scrollToSectionWithHeaderOffset(target: string): void {
  if (typeof window === "undefined") return;
  const el = document.querySelector(target);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_SCROLL_OFFSET_PX;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
