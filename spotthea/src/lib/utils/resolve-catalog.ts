"use client";

import { catalogData } from "@/lib/data/catalog";
import { useAppStore } from "@/stores/app-store";

export function getMergedMangas() {
  const state = useAppStore.getState();
  const customMap = new Map(state.customMangas.map((item) => [item.id, item]));
  return [...state.customMangas, ...catalogData.mangas.filter((item) => !customMap.has(item.id))];
}

export function getMergedChapters() {
  const state = useAppStore.getState();
  const customMap = new Map(state.customChapters.map((item) => [item.id, item]));
  return [...state.customChapters, ...catalogData.chapters.filter((item) => !customMap.has(item.id))];
}

export function resolveMangaById(mangaId: string) {
  const custom = useAppStore.getState().customMangas.find((item) => item.id === mangaId);
  if (custom) {
    return custom;
  }
  return catalogData.getMangaById(mangaId);
}

export function resolveChapterById(chapterId: string) {
  const custom = useAppStore.getState().customChapters.find((item) => item.id === chapterId);
  if (custom) {
    return custom;
  }
  return catalogData.getChapter(chapterId);
}