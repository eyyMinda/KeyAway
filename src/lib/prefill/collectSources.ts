/**
 * @fileoverview Server-side prefill scrape: vendor pages plus the first-party extras (press kit, the
 * Windows installer's version). `scripts/prefillScrape.mjs` mirrors this for the Claude Code commands.
 */
import { findInstaller } from "@/src/lib/versions/installerVersion";
import { findPressKit, readPressKit } from "./pressKit";
import { scrapeForPrefill, type PrefillExtras, type ScrapeResult } from "./scrapePage";

export const prefillExtras: PrefillExtras = async ({ urls, productName, pages }) => {
  const errors: ScrapeResult["errors"] = [];
  const kitUrl = await findPressKit(urls, productName).catch(() => null);
  const pressKit = kitUrl
    ? await readPressKit(kitUrl).catch(err => {
        errors.push({ url: kitUrl, error: err instanceof Error ? err.message : "Press kit failed" });
        return null;
      })
    : null;
  const links = [pressKit?.downloadUrl, ...(pages[0]?.downloadLinks ?? [])].filter((u): u is string => !!u);
  const installer = links.length ? await findInstaller([...new Set(links)]) : null;
  return { pressKit, installer, errors };
};

export function collectPrefillSources(opts: { urls: string[]; productName?: string }): Promise<ScrapeResult> {
  return scrapeForPrefill({ ...opts, extras: prefillExtras });
}
