import { client } from "@/src/sanity/lib/client";
import { allProgramsQuery } from "@lib/queries";
import ProgramCard from "@components/ProgramCard";
import { Program } from "@/src/types/ProgramType";

export default async function HomePage() {
  const programs = await client.fetch(allProgramsQuery);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-6">Most Popular</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {programs.map((program: Program) => (
          <ProgramCard key={program.slug.current} program={program} />
        ))}
      </div>
    </main>
  );
}
