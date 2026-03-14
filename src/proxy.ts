import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory cache to prevent too frequent updates
const lastUpdateTime = new Map<string, number>();
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Auth redirect in proxy caused 302 loop with Auth.js v5 beta. Protection handled by ProtectedAdminLayout.
export function proxy(request: NextRequest) {
  // Forward pathname to request so layout can read it (headers() returns request headers)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  // Only handle program pages for key updates
  if (request.nextUrl.pathname.startsWith("/program/")) {
    const slug = request.nextUrl.pathname.split("/program/")[1];

    if (slug) {
      const now = Date.now();
      const lastUpdate = lastUpdateTime.get(slug) || 0;

      if (now - lastUpdate > UPDATE_INTERVAL) {
        lastUpdateTime.set(slug, now);
        response.headers.set("x-update-keys", "true");
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/program/:path*", "/admin/:path*", "/studio/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
