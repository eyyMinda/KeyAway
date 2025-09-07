import { CDKey } from "@/src/types/ProgramType";
import ProgramComments from "@components/programComments";
import { notFound } from "next/navigation";
import { IdealImage } from "@components/IdealImage";
import Link from "next/link";
import CDKeyActions from "@/src/components/CDKeyActions";
import { getStatusColor, sortCdKeysByStatus, isKeyExpiringSoon } from "@/src/lib/cdKeyUtils";
import { getProgramWithUpdatedKeys } from "@/src/lib/sanityActions";

interface ProgramPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;

  // Get program with automatically updated expired keys
  const program = await getProgramWithUpdatedKeys(slug);

  if (!program) return notFound();

  // Sort CD keys by status (they're already updated in Sanity)
  const sortedCdKeys = sortCdKeysByStatus(program.cdKeys || []);

  // Check if any keys are expiring soon
  const hasExpiringSoonKeys = (program.cdKeys || []).some((key: CDKey) => isKeyExpiringSoon(key));

  return (
    <main className="min-h-screen bg-neutral-900">
      {/* Hero Section */}
      <div className="bg-neutral-800 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Image */}
            <div className="order-2 lg:order-1">
              {program.image ? (
                <div className="relative rounded-2xl overflow-hidden shadow-medium">
                  <IdealImage image={program.image} alt={program.title} className="w-full max-h-96 object-cover" />
                </div>
              ) : (
                <div className="w-full h-80 bg-gradient-to-br from-primary-900 to-accent-900 rounded-2xl flex items-center justify-center shadow-medium">
                  <div className="text-neutral-500 text-6xl">🎮</div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <h1 className="text-4xl font-bold text-white mb-4">{program.title}</h1>
              <p className="text-lg text-neutral-300 mb-6 leading-relaxed">{program.description}</p>

              {/* Download Link */}
              {program.downloadLink && (
                <div className="mb-6">
                  <Link
                    href={program.downloadLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-neutral-800">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download Program
                  </Link>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">{sortedCdKeys.length}</div>
                  <div className="text-sm text-neutral-300">Available Keys</div>
                </div>
                <div className="bg-neutral-700 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-success-400">
                    {sortedCdKeys.filter((cd: CDKey) => cd.status === "active" || cd.status === "new").length}
                  </div>
                  <div className="text-sm text-neutral-300">Working Keys</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keys Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-neutral-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-700">
            <h2 className="text-2xl font-bold text-white">CD Keys</h2>
            <p className="text-neutral-300 mt-1">Available license keys for this program</p>
            {hasExpiringSoonKeys && (
              <div className="mt-3 p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-primary-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-primary-300 text-sm">
                    Some keys are expiring within the next 24 hours. Use them soon!
                  </span>
                </div>
              </div>
            )}
          </div>

          {sortedCdKeys && sortedCdKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-200 text-nowrap">Key</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Version</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Valid From</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Valid Until</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-700">
                  {sortedCdKeys.map((cd: CDKey, i: number) => {
                    const isDisabled = cd.status === "limit" || cd.status === "expired";
                    return (
                      <tr
                        key={i}
                        className={`hover:bg-neutral-700 transition-colors ${isDisabled ? "opacity-50" : ""}`}>
                        <td className="px-6 py-4 text-nowrap">
                          <code
                            className={`px-3 py-1 rounded-lg text-sm font-mono ${
                              isDisabled ? "bg-neutral-600 text-neutral-400" : "bg-neutral-600 text-neutral-200"
                            }`}>
                            {cd.key}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(cd.status)}`}>
                            {cd.status}
                          </span>
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
                          {cd.version}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
                          {cd.validFrom?.split("T")[0]}
                        </td>
                        <td
                          className={`px-6 py-4 text-center text-sm ${isDisabled ? "text-neutral-500" : "text-neutral-300"}`}>
                          {cd.validUntil?.split("T")[0]}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CDKeyActions key={cd.key} cdKey={cd} isDisabled={isDisabled} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="text-neutral-500 text-4xl mb-4">🔑</div>
              <h3 className="text-lg font-semibold text-neutral-300 mb-2">No Keys Available</h3>
              <p className="text-neutral-400">There are currently no CD keys available for this program.</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-neutral-800 rounded-2xl shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-700">
            <h2 className="text-2xl font-bold text-white">Comments</h2>
            <p className="text-neutral-300 mt-1">Share your thoughts about this program</p>
          </div>
          <div className="p-6">
            <ProgramComments />
          </div>
        </div>
      </div>
    </main>
  );
}
