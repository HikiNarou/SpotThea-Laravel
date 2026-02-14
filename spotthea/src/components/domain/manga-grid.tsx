import { MangaCard } from "@/components/domain/manga-card";
import type { MangaCardData } from "@/types/domain";

export function MangaGrid({ items }: { items: MangaCardData[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((manga) => (
        <MangaCard key={manga.id} manga={manga} />
      ))}
    </div>
  );
}