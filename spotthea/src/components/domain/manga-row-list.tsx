import { MangaRow } from "@/components/domain/manga-row";
import type { MangaCardData } from "@/types/domain";

export function MangaRowList({ items }: { items: MangaCardData[] }) {
  return (
    <div className="space-y-3">
      {items.map((manga) => (
        <MangaRow key={manga.id} manga={manga} />
      ))}
    </div>
  );
}