import { MetadataRoute } from "next";
import { client } from "@/src/sanity/lib/client";
import { allProgramsQuery } from "@/src/lib/queries";
import { Program } from "@/src/types/ProgramType";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://keyaway.vercel.app";

  // Get all programs for dynamic routes
  const programs = await client.fetch(allProgramsQuery);

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    }
  ];

  // Dynamic program routes
  const programRoutes: MetadataRoute.Sitemap = programs.map((program: Program) => ({
    url: `${baseUrl}/program/${program.slug.current}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticRoutes, ...programRoutes];
}
