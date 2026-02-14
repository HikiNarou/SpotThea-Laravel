"use client";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/select";
import type { Chapter } from "@/types/domain";

interface ChapterSelectorProps {
  mangaSlug: string;
  currentChapterId: string;
  chapters: Chapter[];
}

export function ChapterSelector({ mangaSlug, currentChapterId, chapters }: ChapterSelectorProps) {
  const router = useRouter();

  return (
    <Select
      value={currentChapterId}
      onChange={(event) => {
        router.push(`/read/${mangaSlug}/${event.target.value}`);
      }}
      aria-label="Pilih chapter"
      className="h-9 min-w-44"
    >
      {chapters
        .sort((a, b) => b.number - a.number)
        .map((chapter) => (
          <option key={chapter.id} value={chapter.id}>
            Ch. {chapter.number} - {chapter.title}
          </option>
        ))}
    </Select>
  );
}