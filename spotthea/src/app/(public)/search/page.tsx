import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import SearchPageClient from "@/features/search/search-page-client";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </PageShell>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}