import SearchInput from "@/src/components/ui/SearchInput";
import { ProgramsFilterProps, FilterType, SortType } from "@/src/types/programs";

export default function ProgramsFilter({
  searchTerm,
  filter,
  sortBy,
  onSearchChange,
  onFilterChange,
  onSortChange
}: ProgramsFilterProps) {
  return (
    <div className="card-base mb-6 rounded-sm p-4 sm:mb-8 sm:p-5 lg:p-6">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6">
        <div className="flex-1">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search programs..."
            className="[&_input]:rounded-sm [&_input]:border-[#3d6e8c] [&_input]:bg-[#32465a] [&_input]:text-[#c6d4df] [&_input]:placeholder:text-[#556772] [&_input]:focus:border-[#66c0f4] [&_input]:focus:ring-[#1a9fff]/30 [&_svg]:text-[#8f98a0]"
          />
        </div>

        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <label
              htmlFor="programs-filter-keys"
              className="whitespace-nowrap text-xs font-medium text-[#8f98a0] sm:text-sm">
              Keys:
            </label>
            <select
              id="programs-filter-keys"
              value={filter}
              onChange={e => onFilterChange(e.target.value as FilterType)}
              className="xs:flex-none flex-1 rounded-sm border border-[#3d6e8c] bg-[#32465a] px-2.5 py-2 text-xs text-[#c6d4df] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30 sm:px-3 sm:text-sm">
              <option value="all">All Programs</option>
              <option value="hasKeys">With Keys</option>
              <option value="noKeys">Without Keys</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label
              htmlFor="programs-filter-sort"
              className="whitespace-nowrap text-xs font-medium text-[#8f98a0] sm:text-sm">
              Sort:
            </label>
            <select
              id="programs-filter-sort"
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortType)}
              className="xs:flex-none flex-1 rounded-sm border border-[#3d6e8c] bg-[#32465a] px-2.5 py-2 text-xs text-[#c6d4df] focus:border-[#66c0f4] focus:outline-none focus:ring-2 focus:ring-[#1a9fff]/30 sm:px-3 sm:text-sm">
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
              <option value="downloads">Most Downloaded</option>
              <option value="latest">Recently Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="name">Name A-Z</option>
              <option value="nameDesc">Name Z-A</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
