import SearchInput from "@/src/components/ui/SearchInput";
import type { PlatformFilterType, ProgramsFilterProps } from "@/src/types/programs";

const SELECT_CLASS =
  "w-full min-w-[8.5rem] rounded-sm border border-[#3d6e8c] bg-[#32465a] px-2.5 py-2 text-xs text-[#c6d4df] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30 sm:min-w-[9.5rem] sm:px-3 sm:text-sm cursor-pointer";

function FilterLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[11px] font-semibold uppercase tracking-wide text-[#8f98a0]">
      {children}
    </label>
  );
}

function PlatformPills({
  value,
  onChange,
  disabled
}: {
  value: PlatformFilterType;
  onChange: (v: PlatformFilterType) => void;
  disabled?: boolean;
}) {
  const options: Array<{ value: PlatformFilterType; label: string }> = [
    { value: "all", label: "All" },
    { value: "windows", label: "Windows" },
    { value: "mac", label: "Mac" }
  ];

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Platform">
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 sm:px-3 ${
              active
                ? "border-[#4a90c4] bg-[#1a3a5c] text-[#66c0f4]"
                : "border-[#2a475e] bg-[#1b2838] text-[#c6d4df] hover:border-[#4a90c4]"
            }`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProgramsFilter({
  searchTerm,
  filter,
  sortBy,
  category,
  platform,
  categories,
  onSearchChange,
  onSearchCommit,
  onFilterChange,
  onSortChange,
  onCategoryChange,
  onPlatformChange
}: ProgramsFilterProps) {
  return (
    <div className="card-base mb-6 rounded-sm p-4 sm:mb-8 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-5">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchCommit?.();
            }
          }}
          placeholder="Search programs..."
          className="w-full [&_input]:rounded-sm [&_input]:border-[#3d6e8c] [&_input]:bg-[#32465a] [&_input]:text-[#c6d4df] [&_input]:placeholder:text-[#556772] [&_input]:focus:border-[#66c0f4] [&_input]:focus:ring-[#1a9fff]/30 [&_svg]:text-[#8f98a0]"
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-1 xl:flex-wrap xl:gap-x-5 xl:gap-y-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <FilterLabel htmlFor="programs-filter-keys">Keys</FilterLabel>
              <select
                id="programs-filter-keys"
                value={filter}
                onChange={e => onFilterChange(e.target.value as ProgramsFilterProps["filter"])}
                className={SELECT_CLASS}>
                <option value="all">All programs</option>
                <option value="hasKeys">With keys</option>
                <option value="noKeys">Without keys</option>
              </select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 lg:col-span-1 xl:min-w-[11rem] xl:flex-1 xl:max-w-xs">
              <FilterLabel htmlFor="programs-filter-category">Category</FilterLabel>
              <select
                id="programs-filter-category"
                value={category}
                onChange={e => onCategoryChange(e.target.value)}
                className={SELECT_CLASS}>
                <option value="all">All categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 min-[480px]:col-span-2 lg:col-span-1 xl:col-span-1 xl:min-w-[12rem]">
              <FilterLabel>Platform</FilterLabel>
              <PlatformPills value={platform} onChange={onPlatformChange} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 xl:w-44 xl:shrink-0">
            <FilterLabel htmlFor="programs-filter-sort">Sort</FilterLabel>
            <select
              id="programs-filter-sort"
              value={sortBy}
              onChange={e => onSortChange(e.target.value as ProgramsFilterProps["sortBy"])}
              className={SELECT_CLASS}>
              <option value="popular">Most popular</option>
              <option value="views">Most viewed</option>
              <option value="downloads">Most downloaded</option>
              <option value="latest">Recently added</option>
              <option value="oldest">Oldest added</option>
              <option value="name">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
