import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory cache to prevent too frequent updates
const lastUpdateTime = new Map<string, number>();
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add pathname header for use in server components
  response.headers.set("x-pathname", request.nextUrl.pathname);

  // Only handle program pages for key updates
  // Admin authentication is handled client-side in ProtectedAdminLayout
  if (request.nextUrl.pathname.startsWith("/program/")) {
    const slug = request.nextUrl.pathname.split("/program/")[1];

    if (slug) {
      const now = Date.now();
      const lastUpdate = lastUpdateTime.get(slug) || 0;

      // If it's been more than 5 minutes since last update for this program
      if (now - lastUpdate > UPDATE_INTERVAL) {
        // Set the last update time
        lastUpdateTime.set(slug, now);

        // Add a header to indicate that keys should be updated
        response.headers.set("x-update-keys", "true");
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/program/:path*", "/admin/:path*", "/studio/:path*", "/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
