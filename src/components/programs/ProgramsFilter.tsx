import { FaSearch } from "react-icons/fa";
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
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
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
