<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChapterResource;
use App\Http\Resources\MangaResource;
use App\Models\Chapter;
use App\Models\Manga;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class UpdateFeedController extends Controller
{
    public function __invoke(Request $request)
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:120'],
            'order' => ['nullable', 'in:latest,oldest'],
            'genre' => ['nullable', 'string', 'max:64'],
            'country' => ['nullable', 'string', 'max:8'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $queryText = trim((string) $request->query('q', ''));
        $order = (string) $request->query('order', 'latest');
        $genre = trim((string) $request->query('genre', 'all'));
        $country = strtoupper(trim((string) $request->query('country', 'ALL')));
        $page = max(1, (int) $request->integer('page', 1));
        $pageSize = max(1, min((int) $request->integer('pageSize', 15), 60));

        if (! in_array($country, ['ALL', 'JP', 'KR', 'CN', 'ID'], true)) {
            $country = 'ALL';
        }

        $cachePayload = [
            'q' => $queryText,
            'order' => $order,
            'genre' => $genre,
            'country' => $country,
            'page' => $page,
            'pageSize' => $pageSize,
        ];
        $cacheKey = 'api:updates:'.sha1(json_encode($cachePayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(45), fn (): array => $this->buildPayload($queryText, $order, $genre, $country, $page, $pageSize))
            : $this->buildPayload($queryText, $order, $genre, $country, $page, $pageSize);

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=15, s-maxage=45, stale-while-revalidate=30');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(string $queryText, string $order, string $genre, string $country, int $page, int $pageSize): array
    {

        $mangaQuery = Manga::query()
            ->visible()
            ->whereHas('chapters', fn (Builder $chapterQuery) => $chapterQuery->published())
            ->with(['genres', 'latestChapter', 'firstChapter'])
            ->withMax(
                ['chapters as latest_chapter_published_at' => fn (Builder $chapterQuery) => $chapterQuery->published()],
                'published_at'
            );

        if ($genre !== '' && strtolower($genre) !== 'all') {
            $mangaQuery->whereHas('genres', fn (Builder $genreQuery) => $genreQuery->where('slug', $genre));
        }

        $this->applyCountryFilter($mangaQuery, $country);

        if ($queryText !== '') {
            $mangaQuery->where(function (Builder $searchQuery) use ($queryText): void {
                $searchQuery
                    ->where('title', 'like', "%{$queryText}%")
                    ->orWhere('alt_title', 'like', "%{$queryText}%")
                    ->orWhereHas('chapters', function (Builder $chapterQuery) use ($queryText): void {
                        $chapterQuery
                            ->published()
                            ->where(function (Builder $chapterSearchQuery) use ($queryText): void {
                                $chapterSearchQuery->where('title', 'like', "%{$queryText}%");

                                if (is_numeric($queryText)) {
                                    $chapterSearchQuery->orWhere('number', (float) $queryText);
                                }
                            });
                    });
            });
        }

        if ($order === 'oldest') {
            $mangaQuery->orderBy('latest_chapter_published_at')->orderBy('id');
        } else {
            $mangaQuery->orderByDesc('latest_chapter_published_at')->orderByDesc('id');
        }

        $paginator = $mangaQuery->paginate($pageSize, ['*'], 'page', $page);

        $mangaCollection = $paginator->getCollection();
        $mangaIds = $mangaCollection->pluck('id')->values()->all();

        $chapterBucketsByMangaId = Chapter::query()
            ->published()
            ->whereIn('manga_id', $mangaIds)
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get()
            ->groupBy('manga_id')
            ->map(fn ($chapters) => $chapters->take(3)->values());

        $items = $mangaCollection->flatMap(function (Manga $manga) use ($chapterBucketsByMangaId) {
            $chapters = $chapterBucketsByMangaId->get($manga->id, collect());

            return $chapters->map(function (Chapter $chapter) use ($manga) {
                $chapter->setRelation('manga', $manga);

                return [
                    'manga' => (new MangaResource($manga))->resolve(),
                    'chapter' => (new ChapterResource($chapter))->resolve(),
                ];
            });
        })->values();

        return [
            'items' => $items,
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ];
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
}
