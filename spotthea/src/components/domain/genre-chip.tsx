import Link from "next/link";

import { cn } from "@/lib/utils/cn";

export function GenreChip({ slug, active = false }: { slug: string; active?: boolean }) {
  return (
    <Link
      href={`/genre/${slug}`}
      className={cn(
        "inline-flex rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]",
      )}
    >
      {slug.replace(/-/g, " ")}
    </Link>
  );
}