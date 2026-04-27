import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/src/lib/admin/adminAuth";
import { rateLimitMiddleware } from "@/src/lib/api/rateLimit";
import { Errors } from "@/src/lib/api/errors";
import { client } from "@/src/sanity/lib/client";
import { buildSiteUrl, submitIndexNow } from "@/src/lib/seo/indexnow";

type SubmitMode = "all" | "programs" | "non_programs" | "custom";

const NON_PROGRAM_PATHS = ["/", "/privacy", "/terms"] as const;

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function parseCustomUrls(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      if (item.startsWith("/")) return buildSiteUrl(item);
      if (item.startsWith("http://") || item.startsWith("https://")) return item;
      return buildSiteUrl(`/${item.replace(/^\/+/, "")}`);
    });
}

async function getProgramUrls(): Promise<string[]> {
  const programs = await client.fetch<Array<{ slug?: { current?: string } }>>(
    `*[_type == "program" && defined(slug.current)]{ slug }`
  );
  const urls = [buildSiteUrl("/programs")];
  for (const program of programs) {
    const slug = program.slug?.current?.trim();
    if (slug) urls.push(buildSiteUrl(`/program/${slug}`));
  }
  return unique(urls);
}

function getNonProgramUrls(): string[] {
  return NON_PROGRAM_PATHS.map(path => buildSiteUrl(path));
}

/** POST /api/v1/admin/indexnow - submit URL set to IndexNow */
export async function POST(req: NextRequest) {
  const { ok: rateOk } = rateLimitMiddleware(req);
  if (!rateOk) return Errors.tooManyRequests();

  const admin = await requireAdminSession();
  if (admin instanceof Response) return admin;

  try {
    const body = (await req.json().catch(() => ({}))) as { mode?: SubmitMode; customUrls?: string };
    const mode = body?.mode;

    if (!mode || !["all", "programs", "non_programs", "custom"].includes(mode)) {
      return Errors.validation("mode must be one of: all, programs, non_programs, custom");
    }

    const programUrls = mode === "programs" || mode === "all" ? await getProgramUrls() : [];
    const nonProgramUrls = mode === "non_programs" || mode === "all" ? getNonProgramUrls() : [];
    const customUrls = mode === "custom" ? parseCustomUrls(body?.customUrls ?? "") : [];

    const urls = unique([...programUrls, ...nonProgramUrls, ...customUrls]);
    if (urls.length === 0) return Errors.validation("No URLs to submit");

    await submitIndexNow(urls);
    return NextResponse.json({
      data: {
        mode,
        submittedCount: urls.length,
        urls
      },
      meta: {}
    });
  } catch (error) {
    console.error("[POST /api/v1/admin/indexnow]", error);
    return Errors.internal();
  }
}
