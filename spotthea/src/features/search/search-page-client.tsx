"use client";

import { SearchIcon } from "lucide-react";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { MangaRowList } from "@/components/domain/manga-row-list";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowseQuery } from "@/lib/api/hooks";
import { encodeBrowseFilters, parseBrowseFilters } from "@/lib/utils/query";

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseBrowseFilters(searchParams), [searchParams]);

  const { data, isLoading } = useBrowseQuery({
    ...filters,
    sort: filters.sort ?? "popular",
  });

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / Search</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Search</h1>
      </header>

      <form
        className="grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[1fr_200px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const q = String(form.get("q") ?? "");
          const sort = String(form.get("sort") ?? "popular");
          const params = encodeBrowseFilters({ ...filters, query: q, sort: sort as typeof filters.sort, page: 1 });
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        <Input name="q" defaultValue={filters.query ?? ""} placeholder="Cari judul, author, artist..." />
        <Select name="sort" defaultValue={filters.sort ?? "popular"}>
          <option value="popular">Popular</option>
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="rating">Rating</option>
          <option value="az">A-Z</option>
        </Select>
        <Button type="submit">
          <SearchIcon size={16} /> Cari
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : null}

      {data ? (
        <>
          <p className="text-sm text-[var(--text-muted)]">{data.total} hasil ditemukan.</p>
          {data.items.length > 0 ? (
            <MangaRowList items={data.items} />
          ) : (
            <EmptyState title="Tidak ada hasil" description="Coba kata kunci lain atau ubah sort." />
          )}

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            makeHref={(page) => {
              const params = encodeBrowseFilters({ ...filters, page });
              return `${pathname}?${params.toString()}`;
            }}
          />
        </>
      ) : null}
    </PageShell>
  );
}
