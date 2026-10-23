import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { mutationClient } from "@/src/lib/sanity/mutationClient";
import { checkProgramVersion, versionCheckProgramProjection, type VersionCheckProgram } from "@/src/lib/versions/runVersionChecks";

/**
 * POST /api/v1/admin/programs/[id]/version-check - Check this program's version now with its saved settings
 * and store the result like the daily job. (Unsaved settings are tested with /api/v1/admin/version-lookup.)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const { id } = await params;
    const program = await mutationClient.fetch<VersionCheckProgram | null>(
      `*[_type == "program" && _id == $id][0]${versionCheckProgramProjection}`,
      { id }
    );
    if (!program) return Errors.notFound("Program not found");

    const outcome = await checkProgramVersion(program);
    return NextResponse.json({ data: outcome, meta: {} });
  } catch (err) {
    console.error("[POST /api/v1/admin/programs/[id]/version-check]", err);
    return Errors.internal();
  }
}
