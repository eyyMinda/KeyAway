import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { client } from "@/src/sanity/lib/client";
import {
  buildProgramPortableTextMigration,
  type ProgramPortableMigrationSource
} from "@/src/lib/admin/migrateProgramPortableText";
import { Errors } from "@/src/lib/api/errors";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";

const PROGRAMS_MIGRATION_QUERY = `*[_type == "program"]{
  _id,
  description,
  aboutSections,
  faq,
  featured
}`;

const BATCH_SIZE = 15;

/** POST — migrate string program fields to portable text (optional dryRun). */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = Boolean((body as { dryRun?: boolean }).dryRun);

    const rows = await client.fetch<ProgramPortableMigrationSource[]>(PROGRAMS_MIGRATION_QUERY);

    const wouldPatch: string[] = [];
    const patched: string[] = [];
    const errors: { id: string; message: string }[] = [];

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      for (const row of chunk) {
        const mig = buildProgramPortableTextMigration(row);
        if (!mig) continue;
        if (dryRun) {
          wouldPatch.push(row._id);
          continue;
        }
        try {
          let patch = client.patch(row._id).set(mig.set);
          if (mig.unset.length > 0) {
            patch = patch.unset(mig.unset);
          }
          await patch.commit();
          patched.push(row._id);
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          errors.push({ id: row._id, message });
        }
      }
    }

    if (!dryRun && patched.length > 0) {
      revalidatePath("/");
      revalidatePath("/programs");
      revalidatePath("/sitemap.xml");
    }

    return NextResponse.json({
      data: {
        dryRun,
        totalPrograms: rows.length,
        wouldPatchCount: wouldPatch.length,
        wouldPatchIds: dryRun ? wouldPatch.slice(0, 50) : undefined,
        patchedCount: dryRun ? 0 : patched.length,
        errorCount: errors.length,
        errors: errors.slice(0, 20)
      },
      meta: {}
    });
  } catch (err) {
    console.error("[POST /api/v1/admin/migrate-program-portable-text]", err);
    return Errors.internal();
  }
}
