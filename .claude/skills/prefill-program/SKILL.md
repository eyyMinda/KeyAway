---
name: prefill-program
description: Research a software program from its vendor pages and write a KeyAway program prefill (description, about sections, FAQ, free vs PRO, SEO, version) as JSON to paste into the admin editor's Prefill dialog. Use when the user runs /prefill-program or asks to prefill, research or write content for a KeyAway program page.
argument-hint: <product page URL> [more URLs] [--name "Product name"]
---

# Prefill a KeyAway program

Produce a `PrefillResult` JSON for one program. The user pastes it into **Admin → Programs → (new or existing program) → Prefill → AI result**, reviews the form and saves. Nothing is written to Sanity from here.

## Steps

1. **Scrape the sources.** Run the shared scraper with the URLs from the arguments (product page first; add FAQ/comparison pages if given):

   ```
   npm run prefill:scrape -- <url> [more urls] --name "<product name>"
   ```

   It prints KeyAway's existing vendors, categories and programs, then the sources as text:
   - **Vendor installer**: the version read from the vendor's own .exe and its file date (the most reliable version and release date).
   - **Official press kit** (IObit press room found automatically; or pass a press kit `.zip` URL / press page URL): product info, version, release date, what's new, description, press release, FAQ and screenshot references (`presskit:…`).
   - The pages: structured data, versions, download links, sections, images and FAQs (IObit product FAQs come from IObit's FAQ page automatically).
   Prefer installer and press kit facts over marketing page text.
   If the product already exists on KeyAway (see "Existing programs"), you are improving that page: say so to the user.

2. **Fill gaps from official sources only.** If something important is missing (FAQs, free vs PRO differences, system requirements), look it up on the vendor's own site (product, comparison, FAQ or support pages) with WebFetch. Do not copy text from third-party sites.

3. **Read the rules and format.** Open `src/lib/prefill/prefillFormat.ts` and follow `PROGRAM_WRITING_RULES` exactly. The output must match `PROGRAM_RESULT_SHAPE` (`kind: "program"`). Only use category names from the scraper's list. Use Markdown in text fields. `latestOfficialVersion` is major.minor only. Pick `imageUrl` and about-section `imageUrl`s from the scraped image URLs when one clearly fits (product screenshots, not banners). Use press kit screenshot references as about-section `imageUrl`s when they match the section. Set `versionCheck` to `{ "source": "installer", "installerUrl": "<installer URL>" }` when an installer was found, otherwise `{ "source": "page", "pageUrl": "<product page>" }` when the page shows a version.

4. **Write and check the file.** Save the JSON to `.prefill/<slug>.json` (git-ignored), then validate it:

   ```
   npm run prefill:check -- .prefill/<slug>.json
   ```

   Fix anything it reports.

5. **Copy it for the user.** Put the file on the clipboard (Windows PowerShell: `Get-Content -Raw .prefill/<slug>.json | Set-Clipboard`; macOS: `pbcopy < .prefill/<slug>.json`).

6. **Report back** in a few lines: which sources you used, what you filled, anything you could not verify (left out) and the next step: open the program in Admin → Programs, click **Prefill**, choose **AI result**, paste, pick the groups to apply, review and save.
