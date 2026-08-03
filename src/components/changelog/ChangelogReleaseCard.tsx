import type { ChangelogRelease, ChangelogTag } from "@/src/lib/changelog/changelogEntries";
import { formatChangelogDate } from "@/src/lib/changelog/changelogEntries";

const TAG_STYLES: Record<ChangelogTag, string> = {
  feat: "border-[#4a90c4]/50 bg-[#1a3a5c]/80 text-[#9fc6e3]",
  fix: "border-[#3d6e1c]/50 bg-[#1a3a2a]/80 text-[#8bc34a]",
  ui: "border-[#7b5ea7]/50 bg-[#2a1f3d]/80 text-[#c9b8e8]",
  perf: "border-[#c9a227]/50 bg-[#3d3010]/80 text-[#f0d878]",
  api: "border-[#2a8f8f]/50 bg-[#143030]/80 text-[#7fd4d4]",
  docs: "border-[#5a6a7a]/50 bg-[#1a2530]/80 text-[#a8b8c8]",
  refactor: "border-[#8f6a3c]/50 bg-[#2a2010]/80 text-[#d4a860]",
  enhance: "border-[#3d8f6e]/50 bg-[#1a3028]/80 text-[#7fd4a8]"
};

type ChangelogReleaseCardProps = {
  release: ChangelogRelease;
  isLatest?: boolean;
};

export default function ChangelogReleaseCard({ release, isLatest = false }: ChangelogReleaseCardProps) {
  return (
    <article
      className={`relative overflow-hidden rounded-sm border bg-[#1b2838] shadow-[0_12px_40px_rgba(0,0,0,0.28)] ${
        isLatest ? "border-[#4a90c4]/70 ring-1 ring-[#4a90c4]/20" : "border-[#2a475e]"
      }`}>
      {isLatest ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#66c0f4] to-transparent"
        />
      ) : null}

      <div className="border-b border-[#2a475e]/80 bg-[#16202d]/80 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {isLatest ? (
            <span className="inline-flex rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9fc6e3]">
              Latest
            </span>
          ) : null}
          <time dateTime={release.releasedAt} className="text-sm font-medium text-[#8f98a0]">
            {formatChangelogDate(release.releasedAt)}
          </time>
          <span className="text-[#556772]">·</span>
          <a
            href={`https://github.com/eyyMinda/KeyAway/pull/${release.prNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#8fd4ff] transition-colors hover:text-white">
            PR #{release.prNumber}
          </a>
        </div>

        <h2 className="mt-3 text-lg font-bold leading-snug text-white sm:text-xl">{release.title}</h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {release.tags.map(tag => (
            <span
              key={tag}
              className={`inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TAG_STYLES[tag]}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-sm leading-relaxed text-[#dce8f2] sm:text-base">{release.summary}</p>

        <div className="rounded-sm border border-[#2a475e]/80 bg-[#0f1923]/50 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#7dd3ff]">Highlights</p>
          <ul className="space-y-2">
            {release.highlights.map(item => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-[#eef4f9]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7dd3ff]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {release.sections?.map(section => (
          <div key={section.title}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#9fadbd]">{section.title}</h3>
            <ul className="space-y-1.5 border-l-2 border-[#2a475e] pl-4">
              {section.items.map(item => (
                <li key={item} className="text-sm leading-relaxed text-[#eef4f9]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  );
}
