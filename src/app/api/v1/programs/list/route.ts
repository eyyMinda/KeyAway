/** GET /api/v1/programs/list — cached program grid data (static /programs shell fetches this client-side). */
import { NextRequest, NextResponse } from "next/server";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { getProgramsListData } from "@/src/lib/programs/getProgramsPageData";

export async function GET(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const sp = req.nextUrl.searchParams;

  try {
    const data = await getProgramsListData(
      sp.get("search") ?? undefined,
      sp.get("filter") ?? undefined,
      sp.get("sort") ?? undefined,
      sp.get("page") ?? undefined
    );

    return NextResponse.json(
      { data, meta: {} },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${PUBLIC_ISR_REVALIDATE_SECONDS}, stale-while-revalidate=${PUBLIC_ISR_REVALIDATE_SECONDS}`
        }
      }
    );
  } catch (err) {
    console.error("[GET /api/v1/programs/list]", err);
    return Errors.internal();
  }
}
