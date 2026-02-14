import { Suspense } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import BrowsePageClient from "@/features/browse/browse-page-client";

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <PageShell className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-96" />
        </PageShell>
      }
    >
      <BrowsePageClient />
    </Suspense>
  );
}