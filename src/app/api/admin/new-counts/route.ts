import { NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/** Lightweight count of new messages and key suggestions in the last 60 days. */
export async function GET() {
  try {
    const since = new Date(Date.now() - SIXTY_DAYS_MS).toISOString();

    const [newMessages, newSuggestions] = await Promise.all([
      client.fetch<number>(`count(*[_type == "contactMessage" && status == "new" && createdAt >= $since])`, {
        since
      }),
      client.fetch<number>(`count(*[_type == "keySuggestion" && status == "new" && createdAt >= $since])`, {
        since
      })
    ]);

    return NextResponse.json({ newMessages: newMessages ?? 0, newSuggestions: newSuggestions ?? 0 });
  } catch (error) {
    console.error("Error fetching admin new counts:", error);
    return NextResponse.json({ newMessages: 0, newSuggestions: 0 }, { status: 500 });
  }
}
