import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

export async function GET() {
  try {
    const assets = await client.fetch<{ _id: string }[]>(
      `*[_type == "sanity.imageAsset"] | order(_updatedAt desc)[0...60]{ _id }`
    );
    return NextResponse.json({ assets: assets ?? [] });
  } catch (error) {
    console.error("Error fetching image assets:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
