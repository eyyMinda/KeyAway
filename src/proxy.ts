import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth redirect in proxy caused 302 loop with Auth.js v5 beta. Protection handled by ProtectedAdminLayout.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/program/:path*"]
};
