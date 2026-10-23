---
name: prefill-vendor
description: Research a software publisher from its own website and write a KeyAway vendor prefill (hub description, aliases, giveaway key vs official PRO comparison, SEO, logo) as JSON to paste into the admin vendor editor's Prefill dialog. Use when the user runs /prefill-vendor or asks to prefill or write content for a KeyAway vendor.
argument-hint: <vendor homepage URL> [more URLs]
---

# Prefill a KeyAway vendor

Produce a `PrefillResult` JSON for one vendor. The user pastes it into **Admin → Programs → Vendors → (new or existing vendor) → Prefill → AI result**, reviews and saves. Nothing is written to Sanity from here.

## Steps

1. **Scrape the sources:**

   ```
   npm run prefill:scrape -- <vendor homepage> [about page, store/compare page]
   ```

   The output starts with KeyAway's existing vendors and programs; if this vendor already exists, you are improving its page.

2. **Fill gaps from the vendor's own site** (about, licensing, store FAQ pages) with WebFetch when needed. No third-party copy.

3. **Follow the rules.** Open `src/lib/prefill/prefillFormat.ts` and follow `VENDOR_WRITING_RULES`; match `VENDOR_RESULT_SHAPE` (`kind: "vendor"`). Pick `logoUrl` from the scraped images marked as logo/icon when one is a clean brand logo.

4. **Write and check** `.prefill/vendor-<slug>.json`:

   ```
   npm run prefill:check -- .prefill/vendor-<slug>.json
   ```

5. **Copy it to the clipboard** (Windows PowerShell: `Get-Content -Raw <file> | Set-Clipboard`; macOS: `pbcopy < <file>`).

6. **Report back** briefly: sources used, what was filled, what was left out, and the next step (Vendors tab → open the vendor → **Prefill** → **AI result** → paste → apply → review → save).
