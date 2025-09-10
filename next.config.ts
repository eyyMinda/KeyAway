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
  }
};

export default nextConfig;
