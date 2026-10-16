"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  showItemCount?: boolean;
  className?: string;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  showItemCount = true,
  className = "",
  itemLabel = "mục"
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize ?? 10))) {
    return null;
  }

  function getPageNumbers(): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }

  const pages = getPageNumbers();
  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <nav className={`paginationContainer ${className}`} aria-label="Phân trang">
      {showItemCount && totalItems !== undefined && pageSize !== undefined && (
        <div className="paginationInfo">
          Hiển thị <strong>{startItem}–{endItem}</strong> trong tổng số <strong>{totalItems}</strong> {itemLabel}
        </div>
      )}

      <div className="paginationControls">
        <button
          type="button"
          className="paginationNavBtn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronLeft size={16} />
          <span className="paginationNavText">Trước</span>
        </button>

        <div className="paginationPages">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="paginationEllipsis">
                  …
                </span>
              );
            }
            const pageNum = Number(p);
            const isActive = pageNum === currentPage;
            return (
              <button
                key={pageNum}
                type="button"
                className={`paginationPageBtn ${isActive ? "active" : ""}`}
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Trang ${pageNum}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="paginationNavBtn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Trang sau"
          title="Trang sau"
        >
          <span className="paginationNavText">Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
