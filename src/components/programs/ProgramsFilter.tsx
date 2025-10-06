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
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Search */}
        <div className="flex-1">
          <SearchInput value={searchTerm} onChange={onSearchChange} placeholder="Search programs..." />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Key Availability Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Keys:</label>
            <select
              value={filter}
              onChange={e => onFilterChange(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="all">All Programs</option>
              <option value="hasKeys">With Keys</option>
              <option value="noKeys">Without Keys</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortType)}
              className="px-3 py-2 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="popular">Most Popular</option>
              <option value="views">Most Viewed</option>
              <option value="downloads">Most Downloaded</option>
              <option value="latest">Latest Added</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
