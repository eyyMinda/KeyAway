import { NextResponse } from "next/server";
import { checkAdminAccess } from "@/src/lib/adminAuth";

export async function GET() {
  try {
    const { isAdmin, user } = await checkAdminAccess();

    return NextResponse.json({
      isAdmin,
      user: user || null
    });
  } catch (error) {
    console.error("Admin access check error:", error);
    return NextResponse.json({ isAdmin: false, user: null }, { status: 500 });
  }
}
