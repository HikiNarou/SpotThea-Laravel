"use client";

import { Bookmark } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore, useUserLibrary } from "@/stores/app-store";
import type { Manga } from "@/types/domain";

interface BookmarkButtonProps {
  mangaId: string;
  manga?: Manga;
}

export function BookmarkButton({ mangaId, manga }: BookmarkButtonProps) {
  const toggleLibrary = useAppStore((state) => state.toggleLibrary);
  const library = useUserLibrary();
  const isBookmarked = library.some((entry) => entry.mangaId === mangaId && entry.type === "bookmark");

  return (
    <Button
      variant={isBookmarked ? "secondary" : "ghost"}
      onClick={() => {
        toggleLibrary(mangaId, "bookmark", manga);
      }}
    >
      <Bookmark size={16} className={isBookmarked ? "fill-current" : ""} />
      {isBookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
