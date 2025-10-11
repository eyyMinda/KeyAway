import { NextRequest, NextResponse } from "next/server";
import { client } from "@/src/sanity/lib/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cdKey, programName, programVersion, programLink, name, email, message } = body;

    // Validate required fields
    if (!cdKey || !programName || !programVersion || !programLink) {
      return NextResponse.json({ error: "All program fields are required" }, { status: 400 });
    }

    // Create document in Sanity
    const result = await client.create({
      _type: "keySuggestion",
      cdKey,
      programName,
      programVersion,
      programLink,
      name: name || undefined,
      email: email || undefined,
      message: message || undefined,
      status: "new",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id: result._id }, { status: 200 });
  } catch (error) {
    console.error("Error creating key suggestion:", error);
    return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
  }
}
