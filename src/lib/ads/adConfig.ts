/** @fileoverview Ad network units (keys are public by design) and the switches that decide where ads render. */

/**
 * On in production, off in `npm run dev`. `NEXT_PUBLIC_ADS_ENABLED=true|false` overrides either way
 * (e.g. turn ads off on a preview deploy, or on locally to check placements).
 */
export const ADS_ENABLED =
  process.env.NEXT_PUBLIC_ADS_ENABLED !== undefined
    ? process.env.NEXT_PUBLIC_ADS_ENABLED === "true"
    : process.env.NODE_ENV === "production";

const AD_EXCLUDED_PATH_PREFIXES = ["/admin", "/studio"] as const;

export function isAdExcludedPath(pathname: string): boolean {
  return AD_EXCLUDED_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/** Site-wide script, loaded at the end of <body>. (No popunder: it hijacks clicks site-wide.) */
export const SOCIAL_BAR_SCRIPT_SRC = "https://bauval.org/14/c78607677d08011f459c04ec1fadaca4";

/** Plain hyperlink offer; layout/colors of the native unit are set in the ad network dashboard, not here. */
export const SMARTLINK_URL = "https://araplhn.org/4/b485a766f0c355c7e52dc6ee84941aed";

/** The script looks up its container by id, so this unit can render only once per page. */
export const NATIVE_BANNER = {
  scriptSrc: "https://bauval.org/21/e329eb778b475d4cfa0f125f20444257",
  containerId: "container-e329eb778b475d4cfa0f125f20444257"
} as const;

/** The `atOptions` iframe banners load their script from `<base>/<key>`. */
export const BANNER_SCRIPT_BASE = "https://bauval.org/22";

export type BannerFormat = { key: string; width: number; height: number };

/** Widest first: `BannerAd` picks the first one that fits its container. */
export const BANNER_FORMATS: readonly BannerFormat[] = [
  { key: "8c1c9f8c872a55af5c37f239abb650ce", width: 728, height: 90 },
  { key: "5153a76a20208020ae6bf28760cfde0a", width: 468, height: 60 },
  { key: "893e7786f7cf57bd749e91f274849558", width: 320, height: 50 }
];

/** Upright unit that sits in a program grid cell (`GridAdCard`). */
export const CARD_BANNER_FORMAT: BannerFormat = { key: "7de787125fbe608e6fb709f2fdfb45ac", width: 160, height: 300 };
