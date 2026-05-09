import React from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  variant?: "simple" | "detailed";
  className?: string;
  alwaysVisible?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  variant = "simple",
  className = "",
  alwaysVisible = false
}: PaginationProps) {
  if (totalPages <= 1 && !alwaysVisible) return null;
  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (variant === "simple") {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {showInfo && (
          <div className="text-sm text-[#8f98a0]">
            Showing <span className="font-medium">{totalItems === 0 ? 0 : startIndex + 1}</span> to{" "}
            <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalItems}</span> results
          </div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="cursor-pointer rounded-sm border border-[#2a475e] px-3 py-1.5 text-sm text-[#c6d4df] transition-colors hover:bg-[#213246] disabled:cursor-not-allowed disabled:opacity-50">
            Prev
          </button>
          <span className="text-sm text-[#8f98a0]">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="cursor-pointer rounded-sm border border-[#2a475e] px-3 py-1.5 text-sm text-[#c6d4df] transition-colors hover:bg-[#213246] disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="cursor-pointer rounded-sm border border-[#2a475e] px-3 py-2 text-[#c6d4df] transition-colors hover:bg-[#213246] disabled:cursor-not-allowed disabled:opacity-50">
        Previous
      </button>

      <div className="flex space-x-1">
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`cursor-pointer rounded-sm border px-3 py-2 transition-colors ${
              page === currentPage
                ? "border-[#66c0f4] bg-[#213246] text-[#c6d4df]"
                : "border-[#2a475e] text-[#8f98a0] hover:bg-[#213246] hover:text-[#c6d4df]"
            }`}>
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="cursor-pointer rounded-sm border border-[#2a475e] px-3 py-2 text-[#c6d4df] transition-colors hover:bg-[#213246] disabled:cursor-not-allowed disabled:opacity-50">
        Next
      </button>
    </div>
  );
}
