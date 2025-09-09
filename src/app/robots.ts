import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio/", "/api/", "/admin/", "/_next/", "/static/"]
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/studio/", "/api/", "/admin/"]
      }
    ],
    sitemap: "https://keyaway.app/sitemap.xml",
    host: "https://keyaway.app"
  };
}
