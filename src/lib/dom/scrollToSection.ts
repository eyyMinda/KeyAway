/**
 * Smooth-scroll to `target` (CSS selector, e.g. `#how-it-works`).
 * Sticky header clearance comes from `scroll-padding-top` on `html` in `src/app/globals.css` — keep in sync if the header height changes.
 */
export function scrollToSectionWithHeaderOffset(target: string): void {
  if (typeof window === "undefined") return;
  const el = document.querySelector(target);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
