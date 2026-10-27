# Program management

How programs and vendors are edited in the admin, how versions are tracked, and how new pages are prefilled. Paths are from the repo root.

## Where things are

| What | Where |
| --- | --- |
| Programs / Vendors / Versions tabs | `/admin/programs` → `src/app/admin/programs/page.tsx` |
| Programs table | `src/components/admin/programs/ProgramsTableView.tsx` |
| Program editor (slide-over) | `src/components/admin/programs/editor/` |
| Vendor editor | `src/components/admin/vendors/` |
| Versions tab | `src/components/admin/programs/VersionsView.tsx` |
| Prefill dialog | `src/components/admin/programs/prefill/` |
| Field rules (shared client/server) | `src/lib/admin/programFields.ts`, `vendorFields.ts`, `sanityShapes.ts` |
| Save helpers | `src/lib/admin/programWrite.ts`, `vendorWrite.ts` |
| Rich text ↔ Markdown | `src/lib/portableText/markdown.ts` |
| Version checks | `src/lib/versions/` |
| Prefill scraping and format | `src/lib/prefill/` |
| Claude Code commands | `.claude/skills/prefill-program`, `.claude/skills/prefill-vendor` |

## Programs tab

- One request loads the list rows, vendors and categories through `GET /api/v1/admin/programs`, server-side with the Sanity token. Vendor IDs like `vendor.iobit` are private in Sanity, so a browser query can't see them.
- Search covers title, slug, vendor and giveaway aliases. Filters cover vendor, category, activation flow, key health and "missing content".
- Filtering and sorting happen in the browser. "Show more" adds rows in steps of 10/20/50/100, and the chosen step is remembered per browser.
- Expanding a row shows only working keys (new or active). Expired and limit-reached keys stay in the editor's Keys tab.
- The open editor is stored in the URL (`?edit=<id>&tab=keys`, `?new=1`, `?vendor=<id>`, `?view=versions`), so refresh and back/forward work.

## Program editor

- **Tabs:**
  - **Basics:** title, slug, vendor, categories, platforms, activation flow, version, download/affiliate links, version tracking.
  - **Content:** description, up to 4 about sections with points, FAQ, free vs PRO rows.
  - **Keys:** status filters, search, bulk paste, remove expired.
  - **Media:** program image, featured copy, showcase GIF.
  - **SEO & discovery:** meta overrides, giveaway aliases.
- **Rich text** is edited as Markdown: `**bold**`, `*italic*`, `- ` lists, `### ` headings, `[links](url)`, and a trailing `\` for a line break. A field whose Markdown wasn't changed is saved as its original Portable Text, untouched. Every rich-text field in the dataset converts to Markdown and back without loss.
- **Saving:** `PATCH /api/v1/admin/programs/[id]` sends `{ rev, fields }` with only the changed fields.
  - The server validates the merged document with the same rules as Studio, for example FAQ needs 0 or 2+ items, max 4 about sections, and required fields per activation flow.
  - It writes with `ifRevisionId`. If anything else changed the program since it was opened, the save answers 409 and the editor offers to reload.
  - A warning appears when the program has an unpublished Studio draft.
- **After a save:** cache tags are invalidated, the header notification feed is rebuilt, and IndexNow is pinged.

## Vendors tab

Vendor cards show the logo tile, program count and missing content. The editor covers name, slug, hub description, logo with background color and opacity, aliases for the giveaway scanner, the "Giveaway key vs Official PRO" rows and SEO. A vendor can only be deleted once no program uses it; change a program's vendor in its Basics tab.

## Version checks

Settings are stored per program in `versionCheck` (source, URL or package ID, auto-apply). Results go in `versionStatus` (latest version found, release date, error), written only by the check.

| Source | How it works | Use for |
| --- | --- | --- |
| `installer` | Reads the version stored inside the vendor's `.exe` from its first 1 MB (HTTP Range), from a Mac `.pkg`'s Distribution file, or from the `.exe` inside a downloaded `.zip` (up to 40 MB); the file's `Last-Modified` is the release date | Vendors with a direct installer link (IObit, iTop, MacBooster, iCare) |
| `page` | Highest "Version x.y" on the page, or a custom regex with one capture group | Vendors whose installer is a small web-installer stub (SoftOrbits) |
| `filepuma` | Searches FilePuma (GlarySoft's software library) for the program name and reads the version from the exact match; requests are spaced 5 s apart per its robots.txt | Programs without an installer source; can lag the vendor by a release |
| `winget` | Highest version folder in `microsoft/winget-pkgs` (GitHub API; `GITHUB_TOKEN` raises the rate limit) | Programs with no usable installer |
| `chocolatey`, `homebrew` | Package catalog APIs | Fallbacks; Homebrew for Mac apps |

- **Comparison:** found versions are trimmed to major.minor (`14.0.1.462` → `14.0`), and a version counts as new only when it's higher than the program's `latestOfficialVersion`.
- **Daily job:** `/api/v1/cron/check-versions` at 06:00 UTC checks every program with a source, four at a time. It writes only when a result changed, and applies the new version itself only for programs with auto-apply on.
- **Admin routes:**
  - `POST /api/v1/admin/programs/[id]/version-check` runs one program's check now.
  - `POST /api/v1/admin/version-lookup` tests unsaved settings, or finds the installer link on a product page (`{ findInstallerOn }`).
- **Stub detection:** the installer reader warns when the file looks like a web installer, meaning it's under 2.5 MB or its name says online/downloader. That version belongs to the downloader, not the program.

## Prefill

### Sources

`POST /api/v1/admin/prefill/scrape` (`src/lib/prefill/collectSources.ts`) gathers:

1. **Pages** (`scrapePage.ts`): metadata and JSON-LD, feature sections with bullets, FAQs, download links, version text and images.
   - Site menus, headers and seasonal promo images are stripped first.
   - The FAQ extractor reads FAQPage JSON-LD, `<details>`, `<dl>` and question-style headings.
   - For IObit pages it also reads the product's section of `iobit.com/en/allfaq.php`.
2. **Press kit** (`pressKit.ts`): a `.zip` URL given directly, a kit linked from a press page, or IObit's press room (`iobit.com/en/pressroom.php`), where the newest kit for the product is picked.
   - It unzips in memory and reads the product information text (version, release date, supported systems, what's new, description), the FAQ and the press release (`.txt` and `.docx`).
   - It also collects screenshots, box shots and logos. These are referenced as `presskit:<zip>#<file>`, and the image import route copies them into Sanity on apply.
3. **Installer** (`src/lib/versions/installerVersion.ts`): the first download link that is a real Windows installer, for the exact version.

### Applying

- **Scraped as-is** (`scrapeToProgramPrefill`) maps the sources straight onto fields. It prefers installer and press-kit versions and lists the press-kit FAQs first.
- **AI result:**
  1. "Copy AI prompt" (`buildProgramPrompt`) copies the sources, KeyAway's writing rules (`PROGRAM_WRITING_RULES`), the expected JSON shape, and the page's current content, so the AI can improve it instead of starting over.
  2. Paste the answer back. `parsePrefillResult` accepts it with or without a code block or extra text around it.
- **Choosing what to apply:** each group (identity, version and tracking, description, about sections, FAQ, free vs PRO, SEO, aliases, image) can be ticked separately. Groups that already have content start unticked.
  - About sections keep the images and icons already in place.
  - Images are copied into Sanity.
  - Nothing is saved until you click Save.

Vendors work the same way with `buildVendorPrompt` and `VENDOR_WRITING_RULES`.

### From Claude Code

`/prefill-program <url> [more urls] --name "Product"` and `/prefill-vendor <url>`:

1. They run `npm run prefill:scrape`, which uses the same sources plus KeyAway's existing vendors, categories and programs.
2. They write JSON by the same rules to `.prefill/<slug>.json` (git-ignored) and check it with `npm run prefill:check`.
3. They copy it to the clipboard.
4. In the admin editor: Prefill → AI result → paste → apply → review → save.

This uses your Claude Code plan; nothing is written to Sanity from the command.
