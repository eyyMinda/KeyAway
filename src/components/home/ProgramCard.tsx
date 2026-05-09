import Link from "next/link";
import { IdealImage } from "@/src/components/general/IdealImage";
import { FaEye, FaDownload, FaKey, FaChevronRight } from "react-icons/fa";
import { ProgramCardProps } from "@/src/types/home";
import { portableTextHasContent, portableTextToPlainText } from "@/src/lib/portableText/toPlainText";

export default function ProgramCard({ program, stats, badges, showStats = true }: ProgramCardProps) {
  const viewKeysLabel = `View keys for ${program.title}`;
  const keyCount = program.keyCount ?? program.cdKeys?.length ?? 0;
  const hasKeys = keyCount > 0;
  const keyBadgeClass = hasKeys
    ? "bg-[#4c6b22] text-[#c6d4df] border border-[#5c8529]"
    : "bg-[#2a2020] text-[#c6d4df] border border-[#6d2626]";

  return (
    <div className="card-base group relative flex flex-col overflow-hidden rounded-sm">
      <Link href={`/program/${program.slug.current}`} title={program.title} className="relative overflow-hidden">
        {program.image ? (
          <IdealImage
            image={program.image}
            alt={program.title}
            className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-40 lg:h-48"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widthHint={520}
          />
        ) : (
          <div className="flex h-36 w-full items-center justify-center bg-[#213246] sm:h-40 lg:h-48">
            <div className="text-3xl text-[#8f98a0] sm:text-4xl">💻</div>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4 flex flex-col gap-1.5 sm:gap-2">
          {badges?.mostViewed && (
            <div className="flex items-center space-x-1 rounded-sm bg-[#1a3a5c] px-2 py-0.5 text-xs font-semibold text-[#c6d4df] sm:px-2.5 sm:py-1 sm:text-sm lg:px-3">
              <FaEye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">Most Viewed</span>
              <span className="xs:hidden">Top</span>
            </div>
          )}
          {badges?.mostDownloaded && (
            <div className="flex items-center space-x-1 rounded-sm bg-[#1a3a2a] px-2 py-0.5 text-xs font-semibold text-[#c6d4df] sm:px-2.5 sm:py-1 sm:text-sm lg:px-3">
              <FaDownload className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden xs:inline">Most Downloaded</span>
              <span className="xs:hidden">Top</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 lg:top-4 lg:right-4">
          <div className={`flex items-center space-x-1 rounded-sm px-2 py-1 text-xs font-semibold sm:px-2.5 sm:py-1.5 sm:text-sm lg:px-3 ${keyBadgeClass}`}>
            <FaKey className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>{keyCount}</span>
          </div>
        </div>
      </Link>

      <div className="flex grow flex-col p-5">
        <h2 className="mb-1 line-clamp-2 text-base font-bold leading-tight text-[#c6d4df] transition-colors group-hover:text-white sm:text-lg lg:text-xl">
          {program.title}
        </h2>

        {program.descriptionPlain ? (
          <p className="mb-2 line-clamp-3 text-xs leading-relaxed text-[#8f98a0] sm:line-clamp-4 sm:text-sm">
            {program.descriptionPlain}
          </p>
        ) : portableTextHasContent(program.description) ? (
          <p className="mb-2 line-clamp-3 text-xs leading-relaxed text-[#8f98a0] sm:line-clamp-4 sm:text-sm">
            {portableTextToPlainText(program.description)}
          </p>
        ) : null}

        {showStats && (stats?.viewCount !== undefined || stats?.downloadCount !== undefined) && (
          <div className="mt-auto mb-2 flex items-center justify-center gap-3 rounded-sm border border-[#2a475e] bg-[#16202d] px-2 py-1.5 text-xs text-[#8f98a0] sm:gap-4 sm:px-3 sm:py-2">
            {stats?.viewCount !== undefined && (
              <div className="flex items-center space-x-1">
                <FaEye className="h-2.5 w-2.5 text-[#66c0f4] sm:h-3 sm:w-3" />
                <span className="font-medium">{stats.viewCount.toLocaleString()} views</span>
              </div>
            )}
            {stats?.downloadCount !== undefined && (
              <div className="flex items-center space-x-1">
                <FaDownload className="h-2.5 w-2.5 text-[#5ba32b] sm:h-3 sm:w-3" />
                <span className="font-medium">{stats.downloadCount.toLocaleString()} downloads</span>
              </div>
            )}
          </div>
        )}

        <Link
          href={`/program/${program.slug.current}`}
          aria-label={viewKeysLabel}
          title={viewKeysLabel}
          className="group/cta inline-flex w-full items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-4 py-2.5 text-sm font-semibold text-[#c6d4df] transition-colors duration-200 ease-out hover:bg-[#5c8529] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#66c0f4] focus:ring-offset-2 focus:ring-offset-[#1b2838] sm:px-5 sm:py-3 sm:text-base lg:px-6">
          <span className="relative z-10">View Keys</span>
          <FaChevronRight className="relative z-10 ml-1.5 h-3 w-3 translate-x-0 transition-transform duration-300 ease-out group-hover/cta:translate-x-1 sm:ml-2 sm:h-3.5 sm:w-3.5" />
        </Link>
      </div>
    </div>
  );
}
