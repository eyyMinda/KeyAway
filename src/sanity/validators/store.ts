/** Validators for `schemaTypes/store/*` (storeDetails, storeOtherLink, etc.). */

/** `storeDetails.seo.siteUrl` — letters-only labels, length rules for 2- vs 3+-part hostnames. */
export function validateStoreSiteUrl(value: unknown): true | string {
  if (value == null || value === "") return true;
  const raw = String(value).trim();
  if (!raw) return true;

  let host: string;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    host = u.hostname.toLowerCase();
  } catch {
    return "Use a real URL, e.g. https://www.keyaway.app";
  }

  const labels = host.split(".");
  if (labels.length < 2) {
    return "Hostname needs at least two parts (e.g. keyaway.app or www.keyaway.app)";
  }

  const lettersOnly = (s: string) => /^[a-zA-Z]+$/.test(s);
  for (const label of labels) {
    if (!label.length || !lettersOnly(label)) {
      return "Each part of the domain must be letters only (no digits, hyphens, or symbols)";
    }
  }

  if (labels.length === 2) {
    if (labels[0].length < 3) return "First part must be at least 3 letters";
    if (labels[1].length < 2) return "Second part must be at least 2 letters";
    return true;
  }

  const sld = labels[labels.length - 2];
  const tld = labels[labels.length - 1];
  if (sld.length < 3) return "Domain segment before the last dot must be at least 3 letters";
  if (tld.length < 2) return "Last segment (TLD) must be at least 2 letters";
  return true;
}

/** `storeDetails.supportEmail` — optional; when set, basic email shape. */
export function validateOptionalSupportEmail(value: unknown): true | string {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address";
  return true;
}

/** `storeOtherLink.url` — domain checks when kind is buymeacoffee or githubRepository. */
export function validateStoreOtherLinkUrl(value: unknown, kind: string | undefined): true | string {
  if (!value || !kind) return true;
  const v = String(value).toLowerCase();
  if (kind === "buymeacoffee" && !v.includes("buymeacoffee.com")) {
    return "URL must contain buymeacoffee.com";
  }
  if (kind === "githubRepository" && !v.includes("github.com")) {
    return "URL must contain github.com";
  }
  return true;
}
