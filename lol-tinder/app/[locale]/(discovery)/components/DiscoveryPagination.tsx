import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PAGE_SIZE_OPTIONS } from "./useDiscoveryPagination";

interface DiscoveryPaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DiscoveryPagination({
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: DiscoveryPaginationProps) {
  if (totalCount === 0) return null;

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        <span>Per page</span>
        <div className="flex items-center gap-1">
          {PAGE_SIZE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => onPageSizeChange(opt)}
              className={`h-8 min-w-[36px] px-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors border ${
                pageSize === opt
                  ? "discovery-accent-text border-white/[0.18]"
                  : "border-white/[0.06] text-zinc-500 hover:border-white/[0.12]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 min-w-[64px] text-center">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
