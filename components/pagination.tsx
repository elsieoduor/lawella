"use client"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  page:        number
  totalPages:  number
  pageSize:    number
  totalItems:  number
  onPage:      (p: number) => void
  onPageSize?: (n: number) => void
  pageSizes?:  number[]
}

export function Pagination({
  page, totalPages, pageSize, totalItems,
  onPage, onPageSize, pageSizes = [10, 25, 50],
}: PaginationProps) {
  const from = (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, totalItems)

  const pages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages]
    if (page >= totalPages - 3) return [1, "…", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages]
    return [1, "…", page-1, page, page+1, "…", totalPages]
  }

  if (totalPages <= 1 && totalItems <= pageSize) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
      <span>{totalItems === 0 ? "No results" : `Showing ${from}–${to} of ${totalItems}`}</span>
      <div className="flex items-center gap-2">
        {onPageSize && (
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white">
            {pageSizes.map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button onClick={() => onPage(page - 1)} disabled={page <= 1}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-red hover:text-brand-red disabled:opacity-40 disabled:cursor-default transition-all">
            <ChevronLeft size={13}/>
          </button>
          {pages().map((p, i) => (
            <button key={i}
              onClick={() => typeof p === "number" && onPage(p)}
              disabled={p === "…"}
              className={cn("w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                p === page  ? "bg-brand-red text-white border border-brand-red"
                : p === "…" ? "cursor-default text-gray-300"
                : "border border-gray-200 hover:border-brand-red hover:text-brand-red"
              )}>
              {p}
            </button>
          ))}
          <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:border-brand-red hover:text-brand-red disabled:opacity-40 disabled:cursor-default transition-all">
            <ChevronRight size={13}/>
          </button>
        </div>
      </div>
    </div>
  )
}
