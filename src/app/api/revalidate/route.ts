// app/api/revalidate/route.ts
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const secret = req.headers.get("sanity-webhook-secret");
    if (secret !== process.env.SANITY_WEBHOOK_SECRET || body.secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    // Always revalidate homepage
    revalidateTag("homepage");

    // Revalidate program pages
    if (body._type === "program" && body.slug?.current) {
      revalidateTag(`program-${body.slug.current}`);
    }

    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error("Error revalidating:", err);
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
