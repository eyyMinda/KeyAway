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

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: imageProviders
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
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.sanity.io https://vercel.live https://va.vercel-scripts.com https://core.sanity-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-src 'none'",
              "connect-src 'self' https://cdn.sanity.io https://*.sanity.io https://vitals.vercel-insights.com https://va.vercel-scripts.com wss://*.sanity.io",
              "media-src 'self'",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
