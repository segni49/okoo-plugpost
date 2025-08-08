"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
  maxVisiblePages?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxVisiblePages = 7,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = []
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      const startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push("ellipsis")
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push("ellipsis")
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav className={cn("flex items-center justify-center space-x-1", className)}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          currentPage === 1
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </button>

      {/* First page (if not already visible) */}
      {showFirstLast && currentPage > Math.ceil(maxVisiblePages / 2) + 1 && totalPages > maxVisiblePages && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            1
          </button>
          <span className="px-2 py-2 text-gray-400">
            <MoreHorizontal className="w-4 h-4" />
          </span>
        </>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => {
        if (page === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400">
              <MoreHorizontal className="w-4 h-4" />
            </span>
          )
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-colors",
              currentPage === page
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {page}
          </button>
        )
      })}

      {/* Last page (if not already visible) */}
      {showFirstLast && currentPage < totalPages - Math.floor(maxVisiblePages / 2) && totalPages > maxVisiblePages && (
        <>
          <span className="px-2 py-2 text-gray-400">
            <MoreHorizontal className="w-4 h-4" />
          </span>
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
          currentPage === totalPages
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </nav>
  )
}

interface SimplePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SimplePaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-colors",
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          )}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-md transition-colors",
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100 border border-gray-300"
          )}
        >
          Next
        </button>
      </div>
    </div>
  )
}
