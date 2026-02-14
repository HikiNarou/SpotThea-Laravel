export const queryKeys = {
  home: (viewerKey: string) => ["home", viewerKey] as const,
  browse: (params: string) => ["browse", params] as const,
  browseInfinite: (params: string) => ["browse-infinite", params] as const,
  genres: ["genres"] as const,
  manga: (slug: string) => ["manga", slug] as const,
  mangaComments: (mangaId: string) => ["manga-comments", mangaId] as const,
  mangaRatingSummary: (mangaId: string, viewerKey: string) => ["manga-rating-summary", mangaId, viewerKey] as const,
  reader: (slug: string, chapterId: string) => ["reader", slug, chapterId] as const,
  updates: (params: string) => ["updates", params] as const,
  popular: ["popular"] as const,
  status: (status: string) => ["status", status] as const,
  suggest: (query: string) => ["suggest", query] as const,
};
