"use client";

import { useMemo } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}

export function Pagination({ page, totalPages, makeHref }: PaginationProps) {
  const pages = useMemo(() => {
    const list = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    return Array.from(list)
      .filter((item) => item >= 1 && item <= totalPages)
      .sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="pagination">
      <Link
        className={cn(
          "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm",
          page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-[var(--surface-hover)]",
        )}
        href={makeHref(Math.max(1, page - 1))}
      >
        Prev
      </Link>

      {pages.map((item) => (
        <Link
          key={item}
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            item === page
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
          )}
          href={makeHref(item)}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </Link>
      ))}

      <Link
        className={cn(
          "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm",
          page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-[var(--surface-hover)]",
        )}
        href={makeHref(Math.min(totalPages, page + 1))}
      >
        Next
      </Link>
    </nav>
  );
}