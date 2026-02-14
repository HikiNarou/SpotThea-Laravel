<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MangaResource;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SearchController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function index(Request $request)
    {
        $filters = $request->all();
        $cacheKey = 'api:search:index:'.sha1(json_encode($filters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(45), fn (): array => $this->buildSearchPayload($filters))
            : $this->buildSearchPayload($filters);

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=15, s-maxage=45, stale-while-revalidate=30');
    }

    public function suggest(Request $request)
    {
        $query = trim((string) $request->query('q', ''));
        $limit = (int) $request->integer('limit', 8);
        $cacheKey = sprintf('api:search:suggest:%s:%d', sha1($query), max(1, min($limit, 20)));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(30), fn (): array => $this->buildSuggestionPayload($query, $limit))
            : $this->buildSuggestionPayload($query, $limit);

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=20');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function buildSearchPayload(array $filters): array
    {
        $paginator = $this->catalogService->search($filters);

        return [
            'items' => MangaResource::collection($paginator->getCollection())->resolve(),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildSuggestionPayload(string $query, int $limit): array
    {
        $items = $this->catalogService->suggest($query, $limit);

        return $items->map(function ($manga) {
            return [
                'id' => (string) $manga->id,
                'slug' => $manga->slug,
                'title' => $manga->title,
                'coverUrl' => $manga->cover_url,
                'status' => $manga->status,
                'latestChapterNumber' => $manga->latestChapter ? (float) $manga->latestChapter->number : 0,
            ];
        })->values()->all();
    }
}
