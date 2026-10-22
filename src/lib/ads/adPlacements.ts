/**
 * @fileoverview Ad placement registry: stable ids recorded in ad stats, with the label and page order the admin
 * Ads page uses to draw each page's snapshot. Grid cards are numbered per grid (`grid-1`, `grid-2`, …).
 */

export type AdPage = "home" | "programs" | "program" | "vendors" | "vendor" | "other";
export type AdUnitKind = "banner" | "native" | "card" | "rail" | "link";
export type AdMetric = "loads" | "fills" | "views" | "clicks";

export const AD_PAGES: ReadonlyArray<{ id: AdPage; label: string }> = [
  { id: "home", label: "Homepage" },
  { id: "programs", label: "All programs" },
  { id: "program", label: "Program pages" },
  { id: "vendors", label: "Vendors" },
  { id: "vendor", label: "Vendor pages" },
  { id: "other", label: "Other pages" }
];

export const AD_UNIT_LABELS: Record<AdUnitKind, string> = {
  banner: "Banner",
  native: "Native",
  card: "Grid card",
  rail: "Side rail",
  link: "Text link"
};

export function adPageFromPath(path: string): AdPage {
  if (path === "/") return "home";
  if (path === "/programs") return "programs";
  if (path.startsWith("/program/")) return "program";
  if (path === "/vendors") return "vendors";
  if (path.startsWith("/vendors/")) return "vendor";
  return "other";
}

/** `order` follows the slot's position from the top of its page. */
export const AD_PLACEMENTS = {
  "home-after-featured": { label: "After featured program", order: 10 },
  "home-after-popular": { label: "After popular programs", order: 30 },
  "home-before-cta": { label: "Before closing call to action", order: 50 },

  "programs-top": { label: "Above the program list", order: 10 },
  "programs-after-grid": { label: "After the program list", order: 30 },
  "programs-after-featured": { label: "After featured program", order: 40 },

  "vendors-bottom": { label: "After the vendor list", order: 30 },

  "vendor-top": { label: "Under the vendor header", order: 10 },
  "vendor-after-grid": { label: "After the program list", order: 30 },
  "vendor-bottom": { label: "After giveaway vs official", order: 40 },

  "program-before-keys": { label: "Above the keys table", order: 10 },
  "program-after-keys": { label: "After the keys table", order: 20 },
  "program-after-pro": { label: "After the Pro offer", order: 30 },
  "program-after-activation": { label: "After activation steps", order: 40 },
  "program-after-about": { label: "After the about section", order: 50 },
  "program-after-community": { label: "After the community banner", order: 60 },
  "program-after-faq": { label: "After the FAQ", order: 70 },
  "program-related-link": { label: "Sponsored link under related programs", order: 80 },
  "program-bottom": { label: "After the discussion", order: 90 },

  "rail-left": { label: "Left side rail", order: 1 },
  "rail-right": { label: "Right side rail", order: 2 },

  "updates-top": { label: "Updates: top", order: 10 },
  "changelog-top": { label: "Changelog: top", order: 20 },
  "how-it-works-mid": { label: "How it works: middle", order: 30 },
  "not-found": { label: "Not found page", order: 40 },

  "footer-link": { label: "Sponsored link in the footer", order: 100 }
} as const satisfies Record<string, { label: string; order: number }>;

export type AdPlacementId = keyof typeof AD_PLACEMENTS | `grid-${number}`;

/** Where each page's program grid sits, so its numbered cards slot into the snapshot order. */
const GRID_ORDER: Partial<Record<AdPage, number>> = { home: 20, programs: 20, vendor: 20 };

const GRID_PLACEMENT = /^grid-(\d{1,2})$/;

export function isKnownAdPlacement(placement: string): placement is AdPlacementId {
  return placement in AD_PLACEMENTS || GRID_PLACEMENT.test(placement);
}

export function describeAdPlacement(page: AdPage, placement: string): { label: string; order: number } {
  const grid = GRID_PLACEMENT.exec(placement);
  if (grid) return { label: `Grid card #${grid[1]}`, order: (GRID_ORDER[page] ?? 25) + Number(grid[1]) / 100 };
  return AD_PLACEMENTS[placement as keyof typeof AD_PLACEMENTS] ?? { label: placement, order: 99 };
}
