import { MetadataRoute } from "next";
import { client } from "@/src/sanity/lib/client";
import { allProgramsQuery } from "@/src/lib/queries";
import { Program, CDKey } from "@/src/types/ProgramType";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://keyaway.app";
  const currentDate = new Date();

  // Get all programs for dynamic routes
  const programs = await client.fetch(allProgramsQuery);

  // Static routes with proper SEO optimization
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.3
    }
  ];

  // Dynamic program routes with optimized priorities and change frequencies
  const programRoutes: MetadataRoute.Sitemap = programs.map((program: Program) => {
    // Calculate priority based on program characteristics
    let priority = 0.8; // Default priority for programs

    // Higher priority for programs with more working keys
    const workingKeys =
      program.cdKeys?.filter((key: CDKey) => key.status === "active" || key.status === "new").length || 0;

    const totalKeys = program.cdKeys?.length || 0;

    // Priority calculation based on working keys ratio and total keys
    if (workingKeys > 5 && totalKeys > 10) priority = 0.9;
    else if (workingKeys > 3 && totalKeys > 5) priority = 0.85;
    else if (workingKeys > 1) priority = 0.8;
    else if (workingKeys === 0)
      priority = 0.6; // Lower priority for programs with no working keys
    else priority = 0.7; // Fallback for edge cases

    // Determine change frequency based on program activity and key availability
    let changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" = "weekly";

    if (workingKeys > 5) changeFrequency = "daily";
    else if (workingKeys > 2) changeFrequency = "weekly";
    else if (workingKeys > 0) changeFrequency = "monthly";
    else changeFrequency = "yearly"; // Very low frequency for programs with no working keys

    // Use actual last modified date if available, otherwise use current date
    const lastModified = program._updatedAt ? new Date(program._updatedAt) : currentDate;

    return {
      url: `${baseUrl}/program/${program.slug.current}`,
      lastModified,
      changeFrequency,
      priority
    };
  });

  // Sort programs by priority (highest first) for better crawling order
  const sortedProgramRoutes = programRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return [...staticRoutes, ...sortedProgramRoutes];
}
