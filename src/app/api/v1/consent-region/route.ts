/** GET /api/v1/consent-region — whether the visitor's country needs opt-in consent before ads load. */
import { NextRequest, NextResponse } from "next/server";

/** EEA + UK + Switzerland: GDPR / UK GDPR + PECR / revFADP require prior consent for ad cookies. */
const OPT_IN_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH"
]);

export function GET(req: NextRequest) {
  const country = req.headers.get("x-vercel-ip-country")?.trim().toUpperCase();
  // No country header (localhost, unknown IP): use the stricter opt-in rule.
  const optIn = !country || OPT_IN_COUNTRIES.has(country);
  return NextResponse.json({ optIn }, { headers: { "Cache-Control": "private, no-store" } });
}
