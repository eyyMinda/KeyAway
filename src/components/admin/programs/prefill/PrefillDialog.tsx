"use client";

import { useMemo, useState } from "react";
import { FaCheck, FaCopy, FaMagic, FaTimes } from "react-icons/fa";
import { parsePrefillResult, type PrefillResult } from "@/src/lib/prefill/prefillFormat";
import type { ScrapeResult } from "@/src/lib/prefill/scrapePage";
import { inputClass, subtleButton } from "../editor/fields";
import type { ImportImage, PrefillGroupInfo } from "./applyPrefill";

type Source = "scraped" | "ai";

interface PrefillDialogProps<G extends string> {
  kind: "program" | "vendor";
  defaultUrl?: string;
  defaultName?: string;
  buildPrompt: (scrape: ScrapeResult | null) => string;
  fromScrape: (scrape: ScrapeResult) => PrefillResult;
  groupsFor: (result: PrefillResult) => PrefillGroupInfo<G>[];
  onApply: (result: PrefillResult, groups: Set<G>, importImage: ImportImage) => Promise<void>;
  onClose: () => void;
}

/** Downloads an image URL into the Sanity asset library. */
const importImage: ImportImage = async url => {
  try {
    const res = await fetch("/api/v1/admin/program-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? (data?.data?.assetId ?? null) : null;
  } catch {
    return null;
  }
};

export default function PrefillDialog<G extends string>({
  kind,
  defaultUrl = "",
  defaultName = "",
  buildPrompt,
  fromScrape,
  groupsFor,
  onApply,
  onClose
}: PrefillDialogProps<G>) {
  const [urls, setUrls] = useState(defaultUrl);
  const [name, setName] = useState(defaultName);
  const [scraping, setScraping] = useState(false);
  const [scrape, setScrape] = useState<ScrapeResult | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [source, setSource] = useState<Source>("scraped");
  const [pasted, setPasted] = useState("");
  const [copied, setCopied] = useState(false);
  const [chosenImage, setChosenImage] = useState<string | null | undefined>(undefined);
  const [unchecked, setUnchecked] = useState<Set<G> | null>(null);
  const [applying, setApplying] = useState(false);

  const imageKey = kind === "program" ? "imageUrl" : "logoUrl";
  const parsed = useMemo(() => (pasted.trim() ? parsePrefillResult(pasted) : null), [pasted]);
  const scrapedResult = useMemo(() => (scrape ? fromScrape(scrape) : null), [scrape, fromScrape]);
  const baseResult = source === "ai" ? (parsed?.ok ? parsed.value : null) : scrapedResult;
  const wrongKind = baseResult && baseResult.kind !== kind;

  // The image picked from the scraped thumbnails overrides the result's image.
  const result = useMemo<PrefillResult | null>(() => {
    if (!baseResult || wrongKind) return null;
    if (chosenImage === undefined) return baseResult;
    const body = { ...(kind === "program" ? baseResult.program : baseResult.vendor), [imageKey]: chosenImage ?? undefined };
    return kind === "program" ? { ...baseResult, program: body } : { ...baseResult, vendor: body };
  }, [baseResult, wrongKind, chosenImage, kind, imageKey]);

  const groups = result ? groupsFor(result) : [];
  // Groups the form already has content for start unchecked, so existing work is not replaced by accident.
  const off = unchecked ?? new Set(groups.filter(g => g.filled).map(g => g.id));
  const selected = new Set(groups.filter(g => g.preview && !off.has(g.id)).map(g => g.id));

  // Press kit images first (official screenshots and box shots); their thumbnails come as data: previews.
  const kitImages = (scrape?.pressKit?.images ?? [])
    .filter(i => i.preview && (kind === "vendor" ? i.kind === "logo" : i.kind !== "logo"))
    .map(i => ({ url: i.ref, alt: `Press kit: ${i.name}`, src: i.preview! }));
  const pageImages = (scrape?.pages.flatMap(p => p.images).filter(i => (kind === "vendor" ? true : i.kind !== "logo")) ?? []).map(i => ({
    url: i.url,
    alt: i.alt,
    src: i.url
  }));
  const images = [...kitImages, ...pageImages];
  const currentImage = (kind === "program" ? result?.program?.imageUrl : result?.vendor?.logoUrl) ?? null;

  const runScrape = async () => {
    setScraping(true);
    setScrapeError(null);
    try {
      const res = await fetch("/api/v1/admin/prefill/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: urls.split(/\s+/).filter(Boolean), productName: name || undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setScrapeError(data?.error?.message ?? "Scrape failed");
        return;
      }
      const s = data.data as ScrapeResult;
      setScrape(s);
      setChosenImage(undefined);
      if (!s.pages.length) setScrapeError(s.errors.map(e => `${e.url}: ${e.error}`).join("; ") || "Nothing could be read from these pages");
    } catch {
      setScrapeError("Network error");
    } finally {
      setScraping(false);
    }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(buildPrompt(scrape));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apply = async () => {
    if (!result) return;
    setApplying(true);
    try {
      await onApply(result, selected, importImage);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  const toggle = (id: G) =>
    setUnchecked(() => {
      const next = new Set(off);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sourceTab = (id: Source, label: string) => (
    <button
      type="button"
      onClick={() => setSource(id)}
      className={`px-3 py-1.5 text-sm font-medium rounded-md cursor-pointer ${
        source === id ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400"
      }`}>
      {label}
    </button>
  );

  const stats = scrape
    ? [
        `${scrape.pages.length} page${scrape.pages.length === 1 ? "" : "s"}`,
        `${scrape.pages.reduce((n, p) => n + p.sections.length, 0)} sections`,
        `${scrape.faqs.length} FAQs`,
        `${images.length} images`,
        scrape.installer
          ? `installer v${scrape.installer.productVersion ?? scrape.installer.fileVersion}`
          : scrape.pages[0]?.versionCandidates[0] && `version ${scrape.pages[0].versionCandidates[0]}`,
        scrape.pressKit && `press kit${scrape.pressKit.version ? ` v${scrape.pressKit.version}` : ""}`
      ].filter(Boolean)
    : [];

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/40 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <FaMagic className="text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Prefill {kind}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Nothing is saved until you review the form and click Save.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <FaTimes />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* 1. Scrape */}
          <section className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">1. Scrape the {kind === "program" ? "product" : "vendor's"} pages</p>
            <textarea
              rows={2}
              value={urls}
              onChange={e => setUrls(e.target.value)}
              placeholder={kind === "program" ? "https://www.iobit.com/en/driver-booster.php\nhttps://… (FAQ or comparison page, optional)" : "https://www.iobit.com/"}
              className={`${inputClass} font-mono text-xs`}
            />
            <div className="flex flex-wrap items-center gap-2">
              {kind === "program" && (
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name (optional, e.g. Driver Booster)" className={`${inputClass} sm:w-72`} />
              )}
              <button
                type="button"
                onClick={runScrape}
                disabled={scraping || !urls.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                {scraping ? "Scraping…" : scrape ? "Scrape again" : "Scrape"}
              </button>
              {stats.length > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{stats.join(" · ")}</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">One URL per line, product page first; a press kit .zip URL works too. IObit FAQs and press kits are fetched automatically, and the vendor installer is read for the exact version.</p>
            {scrapeError && <p className="text-sm text-red-600 dark:text-red-400">{scrapeError}</p>}
            {scrape?.errors.length ? <p className="text-xs text-amber-600 dark:text-amber-400">{scrape.errors.map(e => `${e.url}: ${e.error}`).join("; ")}</p> : null}
          </section>

          {/* 2. Source */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">2. Choose what to fill from</p>
              <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-950 p-1">
                {sourceTab("scraped", "Scraped as-is")}
                {sourceTab("ai", "AI result")}
              </div>
            </div>
            {source === "ai" && (
              <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={copyPrompt} className={subtleButton}>
                    {copied ? <FaCheck size={11} /> : <FaCopy size={11} />} {copied ? "Copied" : "Copy AI prompt"}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Paste it into Claude or ChatGPT{scrape ? "" : " (scrape first for better results)"}, then paste the JSON answer below. Or run{" "}
                    <code className="px-1 rounded bg-gray-100 dark:bg-gray-800">/prefill-{kind} &lt;url&gt;</code> in Claude Code.
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={pasted}
                  onChange={e => setPasted(e.target.value)}
                  placeholder='Paste the AI answer here ({ "kind": "…", … })'
                  className={`${inputClass} font-mono text-xs`}
                />
                {parsed && !parsed.ok && <p className="text-xs text-red-600 dark:text-red-400">{parsed.error}</p>}
                {wrongKind && <p className="text-xs text-red-600 dark:text-red-400">This result is for a {baseResult?.kind}, not a {kind}.</p>}
              </div>
            )}
          </section>

          {/* 3. Pick */}
          {result && (
            <section className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">3. Pick what to apply</p>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-800">
                {groups.map(g => (
                  <label key={g.id} className={`flex items-start gap-3 px-3 py-2.5 ${g.preview ? "cursor-pointer" : "opacity-50"}`}>
                    <input type="checkbox" className="mt-1" disabled={!g.preview} checked={selected.has(g.id)} onChange={() => toggle(g.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                        {g.label}
                        {g.filled && g.preview && <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">replaces current</span>}
                      </span>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{g.preview ?? "Nothing found"}</span>
                    </span>
                  </label>
                ))}
              </div>

              {images.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{kind === "program" ? "Program image" : "Logo"}: click to choose</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.slice(0, 32).map(img => (
                      <button
                        key={img.url}
                        type="button"
                        title={img.alt ?? img.url}
                        onClick={() => setChosenImage(currentImage === img.url ? null : img.url)}
                        className={`h-16 w-24 shrink-0 rounded-lg border-2 overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer ${
                          currentImage === img.url ? "border-blue-500" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                        }`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-800">
          <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!result || selected.size === 0 || applying}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {applying ? "Applying…" : `Apply ${selected.size || ""} to form`}
          </button>
        </footer>
      </div>
    </div>
  );
}
