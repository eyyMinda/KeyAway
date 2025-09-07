import { client } from "@/src/sanity/lib/client";
import { programBySlugQuery } from "@lib/queries";
import { CDKey } from "@/src/types/ProgramType";
import ProgramComments from "@components/programComments";

interface ProgramPageProps {
  params: { slug: string };
}
export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = params;
  const program = await client.fetch(programBySlugQuery, { slug: slug });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">{program.title}</h1>
      <p className="text-gray-700 mb-6">{program.description}</p>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Key</th>
              <th className="p-2">Status</th>
              <th className="p-2">Version</th>
              <th className="p-2">Valid From</th>
              <th className="p-2">Valid Until</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {program.cdKeys?.map((cd: CDKey, i: number) => (
              <tr key={i} className="border-t">
                <td className="p-2 font-mono">{cd.key}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs ${
                      cd.status === "active"
                        ? "bg-green-600"
                        : cd.status === "expired"
                          ? "bg-red-600"
                          : cd.status === "limit"
                            ? "bg-yellow-600"
                            : "bg-blue-600"
                    }`}>
                    {cd.status}
                  </span>
                </td>
                <td className="p-2">{cd.version}</td>
                <td className="p-2">{cd.validFrom?.split("T")[0]}</td>
                <td className="p-2">{cd.validUntil?.split("T")[0]}</td>
                <td className="p-2">{cd.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-2">Comments</h2>
        <ProgramComments />
      </section>
    </main>
  );
}
