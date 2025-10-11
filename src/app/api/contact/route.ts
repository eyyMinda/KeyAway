import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, message, name, email } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    // Create document in Sanity
    const result = await client.create({
      _type: "contactMessage",
      title,
      message,
      name: name || undefined,
      email: email || undefined,
      status: "new",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id: result._id }, { status: 200 });
  } catch (error) {
    console.error("Error creating contact message:", error);
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}
