import React from "react";

export type PaginationTone = "light" | "dark";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  variant?: "simple" | "detailed";
  /** `light` = pale controls on dark sections; `dark` = dark controls on white/light sections. */
  tone?: PaginationTone;
  className?: string;
  alwaysVisible?: boolean;
}

const paginationToneStyles: Record<
  PaginationTone,
  {
    info: string;
    pageSummary: string;
    navButton: string;
    pageButton: string;
    pageButtonActive: string;
  }
> = {
  light: {
    info: "text-[#b8c6d4]",
    pageSummary: "text-[#c6d4df]",
    navButton:
      "border-[#5a7f9a] bg-[#2f4458]/60 text-[#e3edf5] hover:bg-[#3a5268] hover:border-[#6b94b3] disabled:hover:bg-[#2f4458]/60 disabled:hover:border-[#5a7f9a]",
    pageButton: "border-[#5a7f9a] text-[#d8e6f2] hover:bg-[#3a5268] hover:border-[#6b94b3] hover:text-[#f0f6fb]",
    pageButtonActive: "border-[#8ec8ef] bg-[#3d5a73] text-white shadow-sm shadow-black/10"
  },
  dark: {
    info: "text-gray-600",
    pageSummary: "text-gray-700",
    navButton:
      "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:hover:bg-white disabled:hover:border-gray-300",
    pageButton: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900",
    pageButtonActive: "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
  }
};

const navButtonSimple =
  "cursor-pointer rounded-sm border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const navButtonDetailed =
  "cursor-pointer rounded-sm border px-3 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const pageButtonBase = "cursor-pointer rounded-sm border px-3 py-2 transition-colors";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  showInfo = true,
  variant = "simple",
  tone = "dark",
  className = "",
  alwaysVisible = false
}: PaginationProps) {
  if (totalPages <= 1 && !alwaysVisible) return null;
  if (totalItems === 0) return null;

  const styles = paginationToneStyles[tone];
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: number[] = [];
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
  const navButtonClass = `${variant === "simple" ? navButtonSimple : navButtonDetailed} ${styles.navButton}`;

  if (variant === "simple") {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        {showInfo ? (
          <div className={`text-sm ${styles.info}`}>
            Showing <span className="font-medium">{totalItems === 0 ? 0 : startIndex + 1}</span> to{" "}
            <span className="font-medium">{endIndex}</span> of <span className="font-medium">{totalItems}</span> results
          </div>
        ) : null}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={navButtonClass}>
            Prev
          </button>
          <span className={`text-sm ${styles.pageSummary}`}>
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={navButtonClass}>
            Next
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-center items-center space-x-2 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={navButtonClass}>
        Previous
      </button>

      <div className="flex space-x-1">
        {pageNumbers.map(page => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? `${pageButtonBase} ${styles.pageButtonActive}`
                : `${pageButtonBase} ${styles.pageButton}`
            }>
            {page}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={navButtonClass}>
        Next
      </button>
    </div>
  );
}
