import Link from "next/link";
import { Program } from "@/src/types/ProgramType";
import { IdealImage } from "@components/IdealImage";

export default function ProgramCard({ program }: { program: Program }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 hover:shadow-lg transition">
      {program.image && (
        <IdealImage image={program.image} alt={program.title} className="rounded-xl object-cover w-full h-40" />
      )}
      <h2 className="text-lg font-bold mt-3">{program.title}</h2>
      <p className="text-sm text-gray-600">{program.description}</p>
      <Link
        href={`/program/${program.slug.current}`}
        className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
        View Keys
      </Link>
    </div>
  );
}
