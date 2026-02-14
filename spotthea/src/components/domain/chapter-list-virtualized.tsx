"use client";

import { useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { ChapterRow } from "@/components/domain/chapter-row";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useUserHistory } from "@/stores/app-store";
import type { Chapter } from "@/types/domain";

interface ChapterListVirtualizedProps {
  chapters: Chapter[];
  mangaSlug: string;
}

export function ChapterListVirtualized({ chapters, mangaSlug }: ChapterListVirtualizedProps) {
  const history = useUserHistory();
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"latest" | "oldest">("latest");

  const parentRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const base = chapters.filter((chapter) =>
      normalized.length === 0 ? true : `chapter ${chapter.number} ${chapter.title}`.toLowerCase().includes(normalized),
    );

    return base.sort((a, b) => (order === "latest" ? b.number - a.number : a.number - b.number));
  }, [chapters, order, query]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 8,
  });

  const historyByChapter = useMemo(() => {
    const map = new Map(history.map((entry) => [entry.chapterId, entry]));
    return map;
  }, [history]);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari chapter..." />
        <Select value={order} onChange={(event) => setOrder(event.target.value as "latest" | "oldest")}> 
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
        </Select>
      </div>

      <div ref={parentRef} className="max-h-[520px] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const chapter = filtered[virtualRow.index];
            const historyEntry = historyByChapter.get(chapter.id);
            return (
              <div
                key={chapter.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ChapterRow chapter={chapter} mangaSlug={mangaSlug} isRead={Boolean(historyEntry)} history={historyEntry} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
