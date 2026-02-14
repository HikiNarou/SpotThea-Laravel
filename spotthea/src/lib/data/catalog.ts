import { subDays } from "date-fns";

import type {
  BrowseFilters,
  Chapter,
  Manga,
  MangaCardData,
  MangaDetail,
  PagedResult,
  SuggestionItem,
} from "@/types/domain";

const NOW = new Date("2026-02-09T08:00:00.000Z");
const DEFAULT_PAGE_SIZE = 18;

interface MangaSeed {
  title: string;
  altTitle: string;
  slug: string;
  synopsis: string;
  author: string;
  artist: string;
  serialization: string;
  year: number;
  status: Manga["status"];
  type: Manga["type"];
  contentRating: Manga["contentRating"];
  genres: string[];
  chapterCount: number;
  baseRating: number;
  baseRatingCount: number;
  views: number;
  followers: number;
  featuredRank: number | null;
  popularRank: number;
}

const MANGA_SEEDS: MangaSeed[] = [
  {
    title: "Aether Blade Chronicle",
    altTitle: "Kisah Pedang Aether",
    slug: "aether-blade-chronicle",
    synopsis:
      "Seorang kurir distrik industri menemukan pedang kuno yang bisa merekam ingatan para pendekar legendaris. Setiap pertarungan membuka fragmen masa lalu yang perlahan mengungkap konspirasi kerajaan.",
    author: "Rin Kagami",
    artist: "Milo Hartono",
    serialization: "Skyline Weekly",
    year: 2023,
    status: "ongoing",
    type: "manga",
    contentRating: "safe",
    genres: ["action", "fantasy", "adventure"],
    chapterCount: 38,
    baseRating: 4.6,
    baseRatingCount: 12520,
    views: 2834000,
    followers: 183200,
    featuredRank: 1,
    popularRank: 2,
  },
  {
    title: "Neon Requiem",
    altTitle: "Ratapan Neon",
    slug: "neon-requiem",
    synopsis:
      "Detektif cybernetic yang kehilangan memori bekerja sama dengan hacker jalanan untuk membongkar jaringan eksperimen manusia di kota terapung Neo-Jakarta.",
    author: "Aya Voss",
    artist: "Keitaro Han",
    serialization: "Cityline Comics",
    year: 2022,
    status: "ongoing",
    type: "manhwa",
    contentRating: "mature",
    genres: ["action", "sci-fi", "mystery", "thriller"],
    chapterCount: 44,
    baseRating: 4.7,
    baseRatingCount: 19310,
    views: 4211000,
    followers: 265000,
    featuredRank: 2,
    popularRank: 1,
  },
  {
    title: "Hanami at Midnight",
    altTitle: "Hanami Tengah Malam",
    slug: "hanami-at-midnight",
    synopsis:
      "Mahasiswi sastra terjebak kontrak dengan roh pohon sakura. Untuk memutus kutukan, ia harus menulis ulang kisah cinta para arwah yang belum selesai.",
    author: "Sora Minami",
    artist: "Dina Yudhistira",
    serialization: "Moonpetal",
    year: 2021,
    status: "ongoing",
    type: "manga",
    contentRating: "safe",
    genres: ["romance", "drama", "supernatural"],
    chapterCount: 29,
    baseRating: 4.4,
    baseRatingCount: 9120,
    views: 1588000,
    followers: 109400,
    featuredRank: 4,
    popularRank: 7,
  },
  {
    title: "Iron Lotus Regiment",
    altTitle: "Resimen Teratai Besi",
    slug: "iron-lotus-regiment",
    synopsis:
      "Di era perang kolonial alternatif, unit medis garis depan diam-diam menjadi pasukan khusus yang menyelamatkan kota-kota dari senjata biologis.",
    author: "Hiroto Gin",
    artist: "Lia Marcell",
    serialization: "Frontline Prime",
    year: 2020,
    status: "completed",
    type: "manga",
    contentRating: "safe",
    genres: ["action", "drama", "military", "historical"],
    chapterCount: 52,
    baseRating: 4.8,
    baseRatingCount: 27040,
    views: 5081000,
    followers: 312000,
    featuredRank: 3,
    popularRank: 3,
  },
  {
    title: "Golem & Barista",
    altTitle: "Golem dan Barista",
    slug: "golem-and-barista",
    synopsis:
      "Seorang barista pemalu mewarisi kafe tua yang ternyata dihuni golem penjaga. Mereka melayani pelanggan lintas dimensi yang membawa rahasia besar.",
    author: "Nadia Kuro",
    artist: "Pao Irawan",
    serialization: "Steam & Sugar",
    year: 2024,
    status: "ongoing",
    type: "manhua",
    contentRating: "safe",
    genres: ["slice-of-life", "fantasy", "comedy"],
    chapterCount: 21,
    baseRating: 4.3,
    baseRatingCount: 6044,
    views: 940000,
    followers: 78210,
    featuredRank: 5,
    popularRank: 9,
  },
  {
    title: "Ashes of Kanda",
    altTitle: "Abu Kanda",
    slug: "ashes-of-kanda",
    synopsis:
      "Petarung jalanan dari distrik kumuh menemukan dirinya sebagai reinkarnasi penjaga kuil api. Setiap kemenangan membuat masa depannya semakin gelap.",
    author: "Fikri Darma",
    artist: "Ryo Asahi",
    serialization: "Blaze Jump",
    year: 2023,
    status: "ongoing",
    type: "manga",
    contentRating: "mature",
    genres: ["action", "dark-fantasy", "supernatural"],
    chapterCount: 34,
    baseRating: 4.5,
    baseRatingCount: 14350,
    views: 2320000,
    followers: 164000,
    featuredRank: null,
    popularRank: 5,
  },
  {
    title: "Parcel 77",
    altTitle: "Paket 77",
    slug: "parcel-77",
    synopsis:
      "Kurir ekspres antar planet menerima paket misterius yang tidak boleh dibuka. Satu kesalahan kecil memicu perburuan lintas galaksi.",
    author: "Ilyas Noor",
    artist: "Vera Chandra",
    serialization: "Orbit Sprint",
    year: 2025,
    status: "ongoing",
    type: "manhwa",
    contentRating: "safe",
    genres: ["sci-fi", "adventure", "comedy"],
    chapterCount: 17,
    baseRating: 4.1,
    baseRatingCount: 4050,
    views: 522000,
    followers: 45500,
    featuredRank: null,
    popularRank: 12,
  },
  {
    title: "Shards of Everdawn",
    altTitle: "Pecahan Fajar Abadi",
    slug: "shards-of-everdawn",
    synopsis:
      "Penyihir muda mencari tujuh pecahan matahari untuk menghentikan malam abadi. Tiap pecahan dijaga makhluk yang memakan kenangan.",
    author: "Lana Frost",
    artist: "Matsuo Rei",
    serialization: "Aurora Archive",
    year: 2019,
    status: "completed",
    type: "manga",
    contentRating: "safe",
    genres: ["fantasy", "adventure", "drama"],
    chapterCount: 61,
    baseRating: 4.7,
    baseRatingCount: 33710,
    views: 6901000,
    followers: 420900,
    featuredRank: null,
    popularRank: 4,
  },
  {
    title: "Cherry Bomb Idols",
    altTitle: "Idol Cherry Bomb",
    slug: "cherry-bomb-idols",
    synopsis:
      "Tiga trainee gagal membentuk grup idol independen sambil menyelidiki skandal label besar yang mengeksploitasi talenta muda.",
    author: "Mika Ono",
    artist: "Reina Putri",
    serialization: "Pulse Stage",
    year: 2022,
    status: "hiatus",
    type: "manhwa",
    contentRating: "safe",
    genres: ["drama", "music", "comedy"],
    chapterCount: 26,
    baseRating: 4.0,
    baseRatingCount: 5440,
    views: 877000,
    followers: 60220,
    featuredRank: null,
    popularRank: 14,
  },
  {
    title: "Underpass Heresy",
    altTitle: "Bidah Terowongan",
    slug: "underpass-heresy",
    synopsis:
      "Kultus bawah tanah memanggil dewa dari era rel kereta tua. Seorang mantan pastor harus memilih antara iman dan sains untuk menutup gerbangnya.",
    author: "M. Arkana",
    artist: "Sven Ichiro",
    serialization: "Abyss Vault",
    year: 2024,
    status: "ongoing",
    type: "manga",
    contentRating: "mature",
    genres: ["horror", "mystery", "thriller"],
    chapterCount: 19,
    baseRating: 4.2,
    baseRatingCount: 3320,
    views: 481000,
    followers: 38110,
    featuredRank: null,
    popularRank: 15,
  },
  {
    title: "Paper Crane Prosecutor",
    altTitle: "Jaksa Bangau Kertas",
    slug: "paper-crane-prosecutor",
    synopsis:
      "Jaksa muda yang takut keramaian memecahkan kasus korporasi lewat kemampuan origami forensik yang bisa memetakan alur kebohongan saksi.",
    author: "Kenji Aurora",
    artist: "Sasa Lim",
    serialization: "Courtroom Beat",
    year: 2021,
    status: "ongoing",
    type: "manga",
    contentRating: "safe",
    genres: ["mystery", "drama", "slice-of-life"],
    chapterCount: 33,
    baseRating: 4.3,
    baseRatingCount: 7810,
    views: 1198000,
    followers: 83210,
    featuredRank: null,
    popularRank: 10,
  },
  {
    title: "Hydra Terminal",
    altTitle: "Terminal Hydra",
    slug: "hydra-terminal",
    synopsis:
      "Operator pelabuhan antarbenua menemukan AI tua yang dapat memprediksi sabotase. Setiap prediksi berhasil menambah kepala Hydra baru.",
    author: "Tomo Vega",
    artist: "Andri Sato",
    serialization: "Dockline X",
    year: 2025,
    status: "ongoing",
    type: "manhua",
    contentRating: "safe",
    genres: ["sci-fi", "thriller", "action"],
    chapterCount: 15,
    baseRating: 3.9,
    baseRatingCount: 2011,
    views: 280000,
    followers: 23222,
    featuredRank: null,
    popularRank: 16,
  },
  {
    title: "Kitsune Delivery Service",
    altTitle: "Jasa Antar Kitsune",
    slug: "kitsune-delivery-service",
    synopsis:
      "Duo kakak-adik rubah roh membuka layanan antar jimat. Setiap pesanan membawa mereka ke konflik rumah tangga manusia dan yokai.",
    author: "Ari Wicaksono",
    artist: "Mino Takahashi",
    serialization: "Spirit Capsule",
    year: 2020,
    status: "completed",
    type: "manga",
    contentRating: "safe",
    genres: ["comedy", "fantasy", "slice-of-life"],
    chapterCount: 40,
    baseRating: 4.6,
    baseRatingCount: 17010,
    views: 2440000,
    followers: 178330,
    featuredRank: null,
    popularRank: 6,
  },
  {
    title: "Thorn Pact Academy",
    altTitle: "Akademi Pakta Duri",
    slug: "thorn-pact-academy",
    synopsis:
      "Akademi elit penyihir kontrak dibuka untuk rakyat biasa. Murid baru menyadari kekuatan kelas atas ditopang ritual terlarang.",
    author: "Celeste Nara",
    artist: "Kaiyya",
    serialization: "Arcane Young",
    year: 2024,
    status: "ongoing",
    type: "manhwa",
    contentRating: "safe",
    genres: ["fantasy", "school", "drama", "action"],
    chapterCount: 23,
    baseRating: 4.5,
    baseRatingCount: 9740,
    views: 1659000,
    followers: 120440,
    featuredRank: null,
    popularRank: 8,
  },
  {
    title: "Velvet Rebellion",
    altTitle: "Pemberontakan Beludru",
    slug: "velvet-rebellion",
    synopsis:
      "Penjahit kerajaan menyelundupkan pesan revolusi lewat pola bordir rahasia. Setiap gaun baru menggerakkan satu kota menuju kemerdekaan.",
    author: "Nozomi Halim",
    artist: "Raka Jun",
    serialization: "Crown Needle",
    year: 2018,
    status: "completed",
    type: "manga",
    contentRating: "safe",
    genres: ["historical", "romance", "drama"],
    chapterCount: 57,
    baseRating: 4.8,
    baseRatingCount: 41000,
    views: 7320000,
    followers: 501300,
    featuredRank: null,
    popularRank: 11,
  },
];

const DEFAULT_GENRE_ORDER = [
  "action",
  "adventure",
  "fantasy",
  "sci-fi",
  "romance",
  "drama",
  "mystery",
  "thriller",
  "horror",
  "supernatural",
  "slice-of-life",
  "comedy",
  "historical",
  "military",
  "music",
  "school",
  "dark-fantasy",
] as const;

function makeImage(seed: string, width: number, height: number): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

function makeManga(seed: MangaSeed, index: number): Manga {
  const updatedAt = subDays(NOW, index * 2).toISOString();
  return {
    id: `manga-${seed.slug}`,
    slug: seed.slug,
    title: seed.title,
    altTitle: seed.altTitle,
    synopsis: seed.synopsis,
    status: seed.status,
    type: seed.type,
    contentRating: seed.contentRating,
    year: seed.year,
    author: seed.author,
    artist: seed.artist,
    serialization: seed.serialization,
    genres: seed.genres,
    coverUrl: makeImage(`${seed.slug}-cover`, 480, 680),
    bannerUrl: makeImage(`${seed.slug}-banner`, 1600, 600),
    chapterCount: seed.chapterCount,
    baseRating: seed.baseRating,
    baseRatingCount: seed.baseRatingCount,
    views: seed.views,
    followers: seed.followers,
    updatedAt,
    featuredRank: seed.featuredRank,
    popularRank: seed.popularRank,
  };
}

function createChapterPages(mangaSlug: string, chapterNumber: number, pageCount: number) {
  return Array.from({ length: pageCount }, (_, index) => {
    const pageIndex = index + 1;
    return {
      id: `${mangaSlug}-c${chapterNumber}-p${pageIndex}`,
      index: index,
      imageUrl: makeImage(`${mangaSlug}-c${chapterNumber}-p${pageIndex}`, 1200, 1750),
      width: 1200,
      height: 1750,
    };
  });
}

function makeChapters(manga: Manga): Chapter[] {
  return Array.from({ length: manga.chapterCount }, (_, index) => {
    const chapterNumber = index + 1;
    const recencyOffset = (MANGA_SEEDS.length - manga.popularRank) * 4 + (manga.chapterCount - chapterNumber);
    const pageCount = 10 + ((chapterNumber + manga.popularRank) % 8);

    return {
      id: `${manga.id}-chapter-${chapterNumber}`,
      mangaId: manga.id,
      mangaSlug: manga.slug,
      number: chapterNumber,
      title: `Chapter ${chapterNumber}: ${chapterNumber % 3 === 0 ? "Turning Point" : chapterNumber % 2 === 0 ? "Crossroads" : "New Ember"}`,
      publishedAt: subDays(NOW, recencyOffset).toISOString(),
      pages: createChapterPages(manga.slug, chapterNumber, pageCount),
    };
  });
}

const MANGA_LIST = MANGA_SEEDS.map(makeManga);
const CHAPTER_LIST = MANGA_LIST.flatMap((manga) => makeChapters(manga));
const CHAPTERS_BY_MANGA = new Map<string, Chapter[]>();

for (const manga of MANGA_LIST) {
  const chapters = CHAPTER_LIST.filter((chapter) => chapter.mangaId === manga.id).sort((a, b) => b.number - a.number);
  CHAPTERS_BY_MANGA.set(manga.id, chapters);
}

const MANGA_BY_ID = new Map(MANGA_LIST.map((item) => [item.id, item]));
const MANGA_BY_SLUG = new Map(MANGA_LIST.map((item) => [item.slug, item]));
const CHAPTER_BY_ID = new Map(CHAPTER_LIST.map((item) => [item.id, item]));

function matchesCountry(manga: Manga, country: BrowseFilters["country"]): boolean {
  if (!country || country === "ALL") {
    return true;
  }

  if (country === "JP") {
    return manga.type === "manga";
  }

  if (country === "KR") {
    return manga.type === "manhwa";
  }

  if (country === "CN") {
    return manga.type === "manhua";
  }

  return country === "ID" ? manga.originalLanguage === "id" : true;
}

function applyFilters(source: Manga[], filters: BrowseFilters): Manga[] {
  const normalizedQuery = filters.query?.trim().toLowerCase();

  return source
    .filter((manga) => {
      if (normalizedQuery) {
        const haystack = `${manga.title} ${manga.altTitle} ${manga.author} ${manga.artist}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      if (filters.genres?.length) {
        const matched = filters.genres.every((genre) => manga.genres.includes(genre));
        if (!matched) {
          return false;
        }
      }

      if (filters.status?.length && !filters.status.includes(manga.status)) {
        return false;
      }

      if (filters.types?.length && !filters.types.includes(manga.type)) {
        return false;
      }

      if (filters.contentRating?.length && !filters.contentRating.includes(manga.contentRating)) {
        return false;
      }

      if (!matchesCountry(manga, filters.country)) {
        return false;
      }

      if (filters.yearFrom && manga.year < filters.yearFrom) {
        return false;
      }

      if (filters.yearTo && manga.year > filters.yearTo) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      switch (filters.sort) {
        case "rating":
          return right.baseRating - left.baseRating;
        case "latest":
          return +new Date(right.updatedAt) - +new Date(left.updatedAt);
        case "oldest":
          return +new Date(left.updatedAt) - +new Date(right.updatedAt);
        case "az":
          return left.title.localeCompare(right.title);
        case "popular":
        default:
          return left.popularRank - right.popularRank;
      }
    });
}

function paginate<T>(items: T[], page = 1, pageSize = DEFAULT_PAGE_SIZE): PagedResult<T> {
  const normalizedPage = Math.max(1, page);
  const normalizedPageSize = Math.max(1, pageSize);
  const start = (normalizedPage - 1) * normalizedPageSize;
  const sliced = items.slice(start, start + normalizedPageSize);

  return {
    items: sliced,
    total: items.length,
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalPages: Math.max(1, Math.ceil(items.length / normalizedPageSize)),
  };
}

export const catalogData = {
  mangas: MANGA_LIST,
  chapters: CHAPTER_LIST,
  getGenres() {
    const counts = new Map<string, number>();

    for (const manga of MANGA_LIST) {
      for (const genre of manga.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }

    const sorted = Array.from(counts.entries())
      .sort((left, right) => {
        const indexDelta = DEFAULT_GENRE_ORDER.indexOf(left[0] as (typeof DEFAULT_GENRE_ORDER)[number]) - DEFAULT_GENRE_ORDER.indexOf(right[0] as (typeof DEFAULT_GENRE_ORDER)[number]);
        if (indexDelta === 0) {
          return left[0].localeCompare(right[0]);
        }
        return indexDelta;
      })
      .map(([slug, count]) => ({ slug, count, label: slug.replace(/-/g, " ") }));

    return sorted;
  },
  getMangaBySlug(slug: string): Manga | null {
    return MANGA_BY_SLUG.get(slug) ?? null;
  },
  getMangaById(id: string): Manga | null {
    return MANGA_BY_ID.get(id) ?? null;
  },
  getChaptersByMangaId(mangaId: string): Chapter[] {
    return CHAPTERS_BY_MANGA.get(mangaId) ?? [];
  },
  getChapter(chapterId: string): Chapter | null {
    return CHAPTER_BY_ID.get(chapterId) ?? null;
  },
  getChapterBySlugAndNumber(mangaSlug: string, chapterNumber: number): Chapter | null {
    const manga = MANGA_BY_SLUG.get(mangaSlug);
    if (!manga) {
      return null;
    }

    return (CHAPTERS_BY_MANGA.get(manga.id) ?? []).find((item) => item.number === chapterNumber) ?? null;
  },
  getHomeSections() {
    const featured = MANGA_LIST.filter((manga) => manga.featuredRank !== null)
      .sort((a, b) => (a.featuredRank ?? 999) - (b.featuredRank ?? 999))
      .slice(0, 5);

    const latestUpdates = [...CHAPTER_LIST]
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 24)
      .map((chapter) => ({ chapter, manga: MANGA_BY_ID.get(chapter.mangaId)! }));

    const popular = [...MANGA_LIST].sort((a, b) => a.popularRank - b.popularRank).slice(0, 12);
    const latest = [...MANGA_LIST].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 12);
    const ongoing = [...MANGA_LIST].filter((item) => item.status === "ongoing").slice(0, 12);
    const completed = [...MANGA_LIST].filter((item) => item.status === "completed").slice(0, 12);

    return {
      featured,
      latestUpdates,
      tabs: {
        popular,
        latest,
        ongoing,
        completed,
      },
      genres: this.getGenres(),
    };
  },
  browse(filters: BrowseFilters = {}): PagedResult<MangaCardData> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
    const filtered = applyFilters(MANGA_LIST, {
      ...filters,
      sort: filters.sort ?? "popular",
    });

    const paged = paginate(filtered, page, pageSize);

    return {
      ...paged,
      items: paged.items.map((manga) => {
        const chapters = CHAPTERS_BY_MANGA.get(manga.id) ?? [];
        const latestChapter = chapters[0];
        const firstChapter = chapters[chapters.length - 1];
        return {
          ...manga,
          latestChapter,
          firstChapter,
        };
      }),
    };
  },
  searchSuggestions(query: string): SuggestionItem[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return [];
    }

    return MANGA_LIST.filter((manga) => `${manga.title} ${manga.altTitle}`.toLowerCase().includes(normalized))
      .slice(0, 8)
      .map((manga) => {
        const latestChapter = (CHAPTERS_BY_MANGA.get(manga.id) ?? [])[0];
        return {
          id: manga.id,
          slug: manga.slug,
          title: manga.title,
          coverUrl: manga.coverUrl,
          status: manga.status,
          latestChapterNumber: latestChapter?.number ?? 0,
        };
      });
  },
  getMangaDetail(slug: string): MangaDetail | null {
    const manga = MANGA_BY_SLUG.get(slug);
    if (!manga) {
      return null;
    }

    const chapters = CHAPTERS_BY_MANGA.get(manga.id) ?? [];
    const related = MANGA_LIST.filter((item) => item.id !== manga.id)
      .map((item) => {
        const genreOverlap = item.genres.filter((genre) => manga.genres.includes(genre)).length;
        return { item, score: genreOverlap };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((entry) => entry.item);

    return {
      manga,
      chapters,
      related,
    };
  },
  getReaderChapter(mangaSlug: string, chapterId: string) {
    const manga = MANGA_BY_SLUG.get(mangaSlug);
    if (!manga) {
      return null;
    }

    const chapter = CHAPTER_BY_ID.get(chapterId);
    if (!chapter || chapter.mangaId !== manga.id) {
      return null;
    }

    const chapters = CHAPTERS_BY_MANGA.get(manga.id) ?? [];
    const sortedAsc = [...chapters].sort((a, b) => a.number - b.number);
    const currentIndex = sortedAsc.findIndex((item) => item.id === chapter.id);

    return {
      manga,
      chapter,
      prevChapter: currentIndex > 0 ? sortedAsc[currentIndex - 1] : null,
      nextChapter: currentIndex < sortedAsc.length - 1 ? sortedAsc[currentIndex + 1] : null,
      chapterOptions: sortedAsc,
    };
  },
  getStatusFeed(status: Manga["status"]): Manga[] {
    return MANGA_LIST.filter((item) => item.status === status).sort((a, b) => a.popularRank - b.popularRank);
  },
  getPopular() {
    return [...MANGA_LIST].sort((a, b) => a.popularRank - b.popularRank);
  },
  getUpdates() {
    return [...CHAPTER_LIST]
      .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
      .slice(0, 120)
      .map((chapter) => ({ chapter, manga: MANGA_BY_ID.get(chapter.mangaId)! }));
  },
};
