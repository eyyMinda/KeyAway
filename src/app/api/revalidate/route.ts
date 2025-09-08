import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("sanity-webhook-secret");
    if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    const body = await req.json();

    // Revalidate the homepage always
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/`, {
      method: "PURGE" // Vercel's cache purge method
    });

    // If it's a Program, also revalidate its page
    if (body._type === "program" && body.slug?.current) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/program/${body.slug.current}`, {
        method: "PURGE"
      });
    }

    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error("Error revalidating:", err);
    return NextResponse.json({ message: "Error revalidating" }, { status: 500 });
  }
}
