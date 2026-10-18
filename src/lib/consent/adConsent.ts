"use client";

/**
 * @fileoverview Advertising consent store (no React state, read via `useAdConsent`).
 *
 * - Opt-in regions (EEA, UK, Switzerland; see `/api/v1/consent-region`): ads stay off until the visitor accepts.
 * - Elsewhere ads load by default; the footer "Your privacy choices" link opts out.
 * - A Global Privacy Control signal counts as an opt-out until the visitor chooses otherwise.
 * The decision is kept in localStorage (strictly necessary storage) and asked again after `CONSENT_MAX_AGE_MS`.
 */

export type AdConsentStatus = "unknown" | "pending" | "granted" | "denied";
export type AdConsentSnapshot = { status: AdConsentStatus; preferencesOpen: boolean };

type StoredConsent = { v: number; ads: boolean; at: number };

const STORAGE_KEY = "ka_ad_consent";
const REGION_CACHE_KEY = "ka_consent_region";
/** Bump to ask everyone again (e.g. when a new ad partner or purpose is added). */
const CONSENT_VERSION = 1;
const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

const SERVER_SNAPSHOT: AdConsentSnapshot = { status: "unknown", preferencesOpen: false };
let snapshot: AdConsentSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let initStarted = false;

function update(next: Partial<AdConsentSnapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach(listener => listener());
}

export function subscribeAdConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getAdConsentSnapshot = () => snapshot;
export const getAdConsentServerSnapshot = () => SERVER_SNAPSHOT;

function readStoredConsent(): StoredConsent | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as StoredConsent | null;
    if (!parsed || parsed.v !== CONSENT_VERSION || Date.now() - parsed.at > CONSENT_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Unknown country (localhost, failed request) is treated as opt-in, the stricter rule. */
async function requiresOptIn(): Promise<boolean> {
  try {
    const cached = sessionStorage.getItem(REGION_CACHE_KEY);
    if (cached) return cached === "opt-in";
  } catch {}
  try {
    const res = await fetch("/api/v1/consent-region", { cache: "no-store" });
    const { optIn } = (await res.json()) as { optIn: boolean };
    try {
      sessionStorage.setItem(REGION_CACHE_KEY, optIn ? "opt-in" : "opt-out");
    } catch {}
    return optIn;
  } catch {
    return true;
  }
}

function hasGlobalPrivacyControl(): boolean {
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

/** Resolves the starting status once per page load; safe to call from several components. */
export async function initAdConsent(): Promise<void> {
  if (initStarted) return;
  initStarted = true;

  const stored = readStoredConsent();
  if (stored) return update({ status: stored.ads ? "granted" : "denied" });
  if (hasGlobalPrivacyControl()) return update({ status: "denied" });

  const optIn = await requiresOptIn();
  update(optIn ? { status: "pending", preferencesOpen: true } : { status: "granted" });
}

export function setAdConsent(ads: boolean): void {
  const wasGranted = snapshot.status === "granted";
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: CONSENT_VERSION, ads, at: Date.now() } satisfies StoredConsent));
  } catch {}
  update({ status: ads ? "granted" : "denied", preferencesOpen: false });
  // Ad scripts that already ran can't be unloaded; a reload starts the page without them.
  if (wasGranted && !ads) window.location.reload();
}

export function openAdConsentPreferences(): void {
  update({ preferencesOpen: true });
}

/** The first-visit banner in opt-in regions stays until the visitor picks an option. */
export function closeAdConsentPreferences(): void {
  if (snapshot.status !== "pending") update({ preferencesOpen: false });
}
