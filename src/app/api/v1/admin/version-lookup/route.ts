import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { scrapePage } from "@/src/lib/prefill/scrapePage";
import { findInstaller, installerVersion } from "@/src/lib/versions/installerVersion";
import { lookupLatestVersion, type VersionCheckConfig } from "@/src/lib/versions/versionSources";

export const maxDuration = 60;

/**
 * POST /api/v1/admin/version-lookup - Test version-tracking settings. Stores nothing.
 * Body: `{ config }` runs the lookup; `{ findInstallerOn: url }` scans that product page's download links
 * for the vendor's Windows installer and answers `{ installerUrl, version, releasedAt }`.
 */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  const body = (await req.json().catch(() => ({}))) as { config?: VersionCheckConfig; findInstallerOn?: unknown };

  if (typeof body.findInstallerOn === "string") {
    const page = body.findInstallerOn.trim();
    if (!/^https?:\/\//i.test(page)) return Errors.validation("Enter the product page URL");
    try {
      const { downloadLinks } = await scrapePage(page);
      const info = await findInstaller(downloadLinks);
      if (!info) {
        return NextResponse.json({
          data: { ok: false, error: `No Windows installer found among ${downloadLinks.length} download links on that page` },
          meta: {}
        });
      }
      return NextResponse.json({
        data: { ok: true, installerUrl: info.url, version: installerVersion(info), releasedAt: info.releasedAt },
        meta: {}
      });
    } catch (err) {
      return NextResponse.json({ data: { ok: false, error: err instanceof Error ? err.message : "Lookup failed" }, meta: {} });
    }
  }

  return NextResponse.json({ data: await lookupLatestVersion(body.config), meta: {} });
}
