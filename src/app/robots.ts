import { MetadataRoute } from "next";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { resolveSiteBaseUrl } from "@/src/lib/seo/storeSeoResolve";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const store = await getCachedStoreDetailsDocument();
  const baseUrl = resolveSiteBaseUrl(store?.seo);

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
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
