import { client } from "@/src/sanity/lib/client";
import { allProgramsQuery } from "@lib/queries";
import ProgramCard from "@/src/components/home/ProgramCard";
import { Program } from "@/src/types/ProgramType";
import { generateHomePageMetadata } from "@/src/lib/metadata";

export const revalidate = 60;

export async function generateMetadata() {
  return generateHomePageMetadata();
}

export default async function HomePage() {
  const programs = await client.fetch(allProgramsQuery, {}, { next: { tags: ["homepage"] } });

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Most Popular</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {programs.map((program: Program) => (
          <ProgramCard key={program.slug.current} program={program} />
        ))}
      </div>
    </main>
  );
}
