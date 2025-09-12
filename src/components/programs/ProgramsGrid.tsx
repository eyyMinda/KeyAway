import { ProgramCard } from "@/src/components/home";
import { ProgramsGridProps } from "@/src/types/programs";

export default function ProgramsGrid({ programs, maxViews, maxDownloads }: ProgramsGridProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No programs found</h3>
        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {programs.map(program => (
        <ProgramCard
          key={program.slug.current}
          program={program}
          stats={{
            viewCount: program.viewCount,
            downloadCount: program.downloadCount
          }}
          badges={{
            mostViewed: program.viewCount === maxViews && maxViews > 0,
            mostDownloaded: program.downloadCount === maxDownloads && maxDownloads > 0
          }}
          showStats={true}
        />
      ))}
    </div>
  );
}
