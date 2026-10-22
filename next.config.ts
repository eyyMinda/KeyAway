import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const imageProviders: RemotePattern[] = [
  {
    protocol: "https",
    hostname: "cdn.sanity.io",
    pathname: "/**"
  },
  {
    protocol: "https",
    hostname: "avatars.githubusercontent.com",
    pathname: "/u/**"
  },
  {
    protocol: "https",
    hostname: "raw.githubusercontent.com",
    pathname: "/**"
  }
];

/** Ad script origins (see `src/lib/ads/adConfig.ts`) for script-src; add a domain here if an ad *script* gets blocked. */
const AD_ORIGINS = [
  "https://bauval.org",
  "https://araplhn.org",
  "https://*.show-creative1.com"
].join(" ");

const SANITY_AND_VERCEL_CONNECT =
  "https://cdn.sanity.io https://*.sanity.io https://sanity-cdn.com https://sanity-cdn.work https://registry.npmjs.org https://vitals.vercel-insights.com https://va.vercel-scripts.com wss://*.sanity.io";

function buildCsp({ ads }: { ads: boolean }): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.sanity.io https://vercel.live https://va.vercel-scripts.com https://core.sanity-cdn.com${ads ? ` ${AD_ORIGINS}` : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    // Ad creatives and their beacons come from rotating domains, so frames and fetches allow any https origin;
    // which scripts may run at all stays on the script-src allowlist above.
    ads ? "frame-src 'self' https:" : "frame-src 'self' https://vercel.live",
    ads ? "connect-src 'self' https: wss://*.sanity.io" : `connect-src 'self' ${SANITY_AND_VERCEL_CONNECT}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "form-action 'self' https://www.keyaway.app https://keyaway.app",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");
}

const PUBLIC_CSP = buildCsp({ ads: true });
const STRICT_CSP = buildCsp({ ads: false });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageProviders,
    /** Allow `quality` values used by `IdealImage` / `IdealImageClient` / logo `urlFor` + `<Image>`. */
    qualities: [60, 70, 75, 78, 85, 100]
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: [
          // ClickJacking Protection
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          // Content Type Sniffing Protection
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block"
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
          },
          // Content Security Policy (public pages; /admin and /studio get the strict one below)
          { key: "Content-Security-Policy", value: PUBLIC_CSP }
        ]
      },
      // Admin and Studio never show ads: no ad origins, no open connect/frame sources. Overrides the header above.
      ...["/admin", "/admin/:path*", "/studio", "/studio/:path*"].map(source => ({
        source,
        headers: [{ key: "Content-Security-Policy", value: STRICT_CSP }]
      }))
    ];
  }
};

export default nextConfig;
