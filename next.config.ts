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
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://giscus.app https://github.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://github.com https://giscus.app",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.github.com https://giscus.app https://*.api.sanity.io https://vitals.vercel-insights.com",
              "frame-src 'self' https://giscus.app https://github.com",
              "frame-ancestors 'self' https://giscus.app https://github.com",
              "object-src 'none'",
              "base-uri 'self'"
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
