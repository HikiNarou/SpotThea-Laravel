"use client";

import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAppStore, useUserLibrary } from "@/stores/app-store";
import type { Manga } from "@/types/domain";

interface FollowButtonProps {
  mangaId: string;
  manga?: Manga;
}

export function FollowButton({ mangaId, manga }: FollowButtonProps) {
  const toggleLibrary = useAppStore((state) => state.toggleLibrary);
  const library = useUserLibrary();
  const isFollowing = library.some((entry) => entry.mangaId === mangaId && entry.type === "following");

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={() => {
        toggleLibrary(mangaId, "following", manga);
      }}
    >
      <Heart size={16} className={isFollowing ? "fill-current" : ""} />
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
