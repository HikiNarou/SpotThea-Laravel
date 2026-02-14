<?php

namespace App\Services;

use App\Models\Chapter;
use App\Models\Genre;
use App\Models\Manga;
use App\Models\ReadingHistory;
use App\Models\User;
use App\Support\DatabaseSchemaState;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

class CatalogService
{
    private const DEFAULT_PAGE_SIZE = 18;

    private const MAX_PAGE_SIZE = 60;

    public function home(?User $user = null): array
    {
        $featured = Manga::query()
            ->visible()
            ->whereNotNull('featured_rank')
            ->with($this->mangaRelations())
            ->orderBy('featured_rank')
            ->limit(5)
            ->get();

        $latestUpdates = Chapter::query()
            ->published()
            ->whereHas('manga', fn (Builder $query) => $query->visible())
            ->with($this->chapterWithMangaRelations())
            ->orderByDesc('published_at')
            ->limit(60)
            ->get();

        $tabs = [
            'popular' => Manga::query()
                ->visible()
                ->with($this->mangaRelations())
                ->orderBy('popular_rank')
                ->limit(12)
                ->get(),
            'latest' => Manga::query()
                ->visible()
                ->with($this->mangaRelations())
                ->orderByDesc('updated_content_at')
                ->orderByDesc('updated_at')
                ->limit(12)
                ->get(),
            'ongoing' => Manga::query()
                ->visible()
                ->with($this->mangaRelations())
                ->where('status', 'ongoing')
                ->orderBy('popular_rank')
                ->limit(12)
                ->get(),
            'completed' => Manga::query()
                ->visible()
                ->with($this->mangaRelations())
                ->where('status', 'completed')
                ->orderBy('popular_rank')
                ->limit(12)
                ->get(),
        ];

        $genres = Genre::query()
            ->withCount(['mangas as mangas_count' => fn (Builder $query) => $query->visible()])
            ->orderByDesc('mangas_count')
            ->orderBy('name')
            ->get();

        $continueReading = collect();

        if ($user !== null) {
            $continueReading = ReadingHistory::query()
                ->where('user_id', $user->id)
                ->whereHas('manga', fn (Builder $query) => $query->visible())
                ->with($this->continueReadingRelations())
                ->orderByDesc('updated_at')
                ->limit(12)
                ->get();
        }

        return [
            'featured' => $featured,
            'latestUpdates' => $latestUpdates,
            'tabs' => $tabs,
            'genres' => $genres,
            'continueReading' => $continueReading,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function browse(array $filters): LengthAwarePaginator
    {
        $query = Manga::query()
            ->visible()
            ->with($this->mangaRelations());

        $this->applyBrowseFilters($query, $filters);

        $sort = (string) ($filters['sort'] ?? 'popular');
        $this->applySort($query, $sort);

        $page = max((int) ($filters['page'] ?? 1), 1);
        $pageSize = $this->normalizePageSize((int) ($filters['pageSize'] ?? self::DEFAULT_PAGE_SIZE));

        return $query->paginate($pageSize, ['*'], 'page', $page);
    }

    public function genres(): Collection
    {
        return Genre::query()
            ->withCount(['mangas as mangas_count' => fn (Builder $query) => $query->visible()])
            ->orderBy('name')
            ->get();
    }

    public function detail(string $slug): ?array
    {
        $manga = Manga::query()
            ->visible()
            ->where('slug', $slug)
            ->with([
                ...$this->mangaRelations(),
                'chapters' => fn (HasMany $query) => $query->published()->with('pages')->orderByDesc('number'),
            ])
            ->first();

        if ($manga === null) {
            return null;
        }

        $genreIds = $manga->genres->pluck('id')->all();

        $related = Manga::query()
            ->visible()
            ->whereKeyNot($manga->id)
            ->with($this->mangaRelations())
            ->when($genreIds !== [], function (Builder $query) use ($genreIds): void {
                $query->withCount([
                    'genres as overlap_count' => fn (Builder $genreQuery) => $genreQuery->whereIn('genres.id', $genreIds),
                ])->orderByDesc('overlap_count');
            })
            ->orderBy('popular_rank')
            ->limit(6)
            ->get();

        return [
            'manga' => $manga,
            'chapters' => $manga->chapters,
            'related' => $related,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function chapterList(string $slug, array $filters): ?array
    {
        $manga = Manga::query()->visible()->where('slug', $slug)->first();

        if ($manga === null) {
            return null;
        }

        $query = Chapter::query()
            ->published()
            ->where('manga_id', $manga->id)
            ->with('manga')
            ->orderByDesc('number');

        $search = trim((string) ($filters['query'] ?? ''));
        if ($search !== '') {
            $query->where(function (Builder $chapterQuery) use ($search): void {
                $chapterQuery
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%");
            });
        }

        $page = max((int) ($filters['page'] ?? 1), 1);
        $pageSize = $this->normalizePageSize((int) ($filters['pageSize'] ?? 50));

        $paginator = $query->paginate($pageSize, ['*'], 'page', $page);

        return [
            'manga' => $manga,
            'paginator' => $paginator,
        ];
    }

    public function reader(string $slug, string $chapterKey): ?array
    {
        $manga = Manga::query()
            ->visible()
            ->where('slug', $slug)
            ->with($this->readerMangaRelations())
            ->first();

        if ($manga === null) {
            return null;
        }

        $chapter = $this->resolveChapter($manga->id, $chapterKey);

        if ($chapter === null || ! $chapter->is_published) {
            return null;
        }

        $chapter->load(['manga', 'pages']);

        $chapterOptions = Chapter::query()
            ->published()
            ->where('manga_id', $manga->id)
            ->with('manga')
            ->orderBy('number')
            ->get();

        $prevChapter = Chapter::query()
            ->published()
            ->where('manga_id', $manga->id)
            ->where('number', '<', $chapter->number)
            ->with('manga')
            ->orderByDesc('number')
            ->first();

        $nextChapter = Chapter::query()
            ->published()
            ->where('manga_id', $manga->id)
            ->where('number', '>', $chapter->number)
            ->with('manga')
            ->orderBy('number')
            ->first();

        return [
            'manga' => $manga,
            'chapter' => $chapter,
            'prevChapter' => $prevChapter,
            'nextChapter' => $nextChapter,
            'chapterOptions' => $chapterOptions,
        ];
    }

    public function updates(int $limit = 120): Collection
    {
        $normalizedLimit = max(1, min($limit, 300));

        return Chapter::query()
            ->published()
            ->whereHas('manga', fn (Builder $query) => $query->visible())
            ->with($this->chapterWithMangaRelations())
            ->orderByDesc('published_at')
            ->limit($normalizedLimit)
            ->get();
    }

    public function popular(int $limit = 60): Collection
    {
        $normalizedLimit = max(1, min($limit, 200));

        return Manga::query()
            ->visible()
            ->with($this->mangaRelations())
            ->orderBy('popular_rank')
            ->limit($normalizedLimit)
            ->get();
    }

    public function byStatus(string $status, int $limit = 60): Collection
    {
        $normalizedLimit = max(1, min($limit, 200));

        return Manga::query()
            ->visible()
            ->with($this->mangaRelations())
            ->where('status', $status)
            ->orderBy('popular_rank')
            ->limit($normalizedLimit)
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters): LengthAwarePaginator
    {
        $query = Manga::query()
            ->visible()
            ->with($this->mangaRelations());

        $text = trim((string) ($filters['q'] ?? $filters['query'] ?? ''));
        if ($text !== '') {
            $query->where(function (Builder $searchQuery) use ($text): void {
                $searchQuery
                    ->where('title', 'like', "%{$text}%")
                    ->orWhere('alt_title', 'like', "%{$text}%")
                    ->orWhere('author', 'like', "%{$text}%")
                    ->orWhere('artist', 'like', "%{$text}%");
            });
        }

        $this->applyBrowseFilters($query, $filters);
        $this->applySort($query, (string) ($filters['sort'] ?? 'popular'));

        $page = max((int) ($filters['page'] ?? 1), 1);
        $pageSize = $this->normalizePageSize((int) ($filters['pageSize'] ?? self::DEFAULT_PAGE_SIZE));

        return $query->paginate($pageSize, ['*'], 'page', $page);
    }

    public function suggest(string $query, int $limit = 8): Collection
    {
        $text = trim($query);
        if ($text === '') {
            return collect();
        }

        $normalizedLimit = max(1, min($limit, 20));

        return Manga::query()
            ->visible()
            ->with('latestChapter')
            ->where(function (Builder $mangaQuery) use ($text): void {
                $mangaQuery
                    ->where('title', 'like', "%{$text}%")
                    ->orWhere('alt_title', 'like', "%{$text}%");
            })
            ->orderBy('popular_rank')
            ->limit($normalizedLimit)
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function applyBrowseFilters(Builder $query, array $filters): void
    {
        $text = trim((string) ($filters['query'] ?? ''));

        if ($text !== '') {
            $query->where(function (Builder $searchQuery) use ($text): void {
                $searchQuery
                    ->where('title', 'like', "%{$text}%")
                    ->orWhere('alt_title', 'like', "%{$text}%")
                    ->orWhere('author', 'like', "%{$text}%")
                    ->orWhere('artist', 'like', "%{$text}%");
            });
        }

        $genres = $this->normalizeList($filters['genres'] ?? []);
        foreach ($genres as $slug) {
            $query->whereHas('genres', fn (Builder $genreQuery) => $genreQuery->where('slug', $slug));
        }

        $status = $this->normalizeList($filters['status'] ?? []);
        if ($status !== []) {
            $query->whereIn('status', $status);
        }

        $types = $this->normalizeList($filters['types'] ?? $filters['type'] ?? []);
        if ($types !== []) {
            $query->whereIn('type', $types);
        }

        $contentRating = $this->normalizeList($filters['contentRating'] ?? $filters['content_rating'] ?? []);
        if ($contentRating !== []) {
            $query->whereIn('content_rating', $contentRating);
        }

        $yearFrom = isset($filters['yearFrom']) ? (int) $filters['yearFrom'] : (isset($filters['year_from']) ? (int) $filters['year_from'] : null);
        if ($yearFrom !== null && $yearFrom > 0) {
            $query->where('year', '>=', $yearFrom);
        }

        $yearTo = isset($filters['yearTo']) ? (int) $filters['yearTo'] : (isset($filters['year_to']) ? (int) $filters['year_to'] : null);
        if ($yearTo !== null && $yearTo > 0) {
            $query->where('year', '<=', $yearTo);
        }

        $country = strtoupper(trim((string) ($filters['country'] ?? 'ALL')));
        if (! in_array($country, ['ALL', 'JP', 'KR', 'CN', 'ID'], true)) {
            $country = 'ALL';
        }

        $this->applyCountryFilter($query, $country);
    }

    private function applySort(Builder $query, string $sort): void
    {
        match ($sort) {
            'latest' => $query->orderByDesc('updated_content_at')->orderByDesc('updated_at'),
            'oldest' => $query->orderBy('updated_content_at')->orderBy('updated_at'),
            'rating' => $query->orderByDesc('base_rating')->orderByDesc('base_rating_count'),
            'az' => $query->orderBy('title'),
            default => $query->orderBy('popular_rank'),
        };
    }

    private function applyCountryFilter(Builder $mangaQuery, string $country): void
    {
        match ($country) {
            'JP' => $mangaQuery->where(function (Builder $query): void {
                $query
                    ->where('type', 'manga')
                    ->orWhereIn('original_language', ['ja', 'jp']);
            }),
            'KR' => $mangaQuery->where(function (Builder $query): void {
                $query
                    ->where('type', 'manhwa')
                    ->orWhereIn('original_language', ['ko', 'kr']);
            }),
            'CN' => $mangaQuery->where(function (Builder $query): void {
                $query
                    ->where('type', 'manhua')
                    ->orWhereIn('original_language', ['zh', 'cn']);
            }),
            'ID' => $mangaQuery->whereIn('original_language', ['id', 'ind']),
            default => null,
        };
    }

    /**
     * @return list<string>
     */
    private function normalizeList(mixed $value): array
    {
        if (is_string($value)) {
            $value = explode(',', $value);
        }

        if (! is_array($value)) {
            return [];
        }

        return array_values(
            array_filter(
                array_map(
                    static fn (mixed $item): string => trim((string) $item),
                    $value,
                ),
                static fn (string $item): bool => $item !== '',
            ),
        );
    }

    private function normalizePageSize(int $pageSize): int
    {
        return max(1, min($pageSize, self::MAX_PAGE_SIZE));
    }

    private function resolveChapter(int $mangaId, string $chapterKey): ?Chapter
    {
        if (ctype_digit($chapterKey)) {
            return Chapter::query()
                ->where('manga_id', $mangaId)
                ->whereKey((int) $chapterKey)
                ->first();
        }

        if (preg_match('/chapter-([0-9]+(?:\\.[0-9]+)?)$/', $chapterKey, $matches) === 1) {
            $number = (float) $matches[1];

            return Chapter::query()
                ->where('manga_id', $mangaId)
                ->where('number', $number)
                ->first();
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function mangaRelations(): array
    {
        $relations = ['genres', 'latestChapter', 'firstChapter'];

        if (DatabaseSchemaState::hasThemeTables()) {
            $relations[] = 'themes';
        }

        return $relations;
    }

    /**
     * @return list<string>
     */
    private function readerMangaRelations(): array
    {
        $relations = ['genres'];

        if (DatabaseSchemaState::hasThemeTables()) {
            $relations[] = 'themes';
        }

        return $relations;
    }

    /**
     * @return list<string>
     */
    private function chapterWithMangaRelations(): array
    {
        $relations = ['manga.genres'];

        if (DatabaseSchemaState::hasThemeTables()) {
            $relations[] = 'manga.themes';
        }

        return $relations;
    }

    /**
     * @return list<string>
     */
    private function continueReadingRelations(): array
    {
        $relations = ['manga.genres', 'chapter.manga'];

        if (DatabaseSchemaState::hasThemeTables()) {
            $relations[] = 'manga.themes';
        }

        return $relations;
    }
}
