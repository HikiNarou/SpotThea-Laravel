<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MangaResource;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MangaBrowseController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function __invoke(Request $request)
    {
        $request->validate([
            'query' => ['nullable', 'string', 'max:120'],
            'genres' => ['nullable'],
            'status' => ['nullable'],
            'types' => ['nullable'],
            'contentRating' => ['nullable'],
            'country' => ['nullable', 'string', 'max:8'],
            'yearFrom' => ['nullable', 'integer', 'min:0', 'max:3000'],
            'yearTo' => ['nullable', 'integer', 'min:0', 'max:3000'],
            'sort' => ['nullable', 'in:popular,latest,oldest,rating,az'],
            'page' => ['nullable', 'integer', 'min:1'],
            'pageSize' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        $filters = $request->all();
        $cacheKey = 'api:browse:'.sha1(json_encode($filters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(60), fn (): array => $this->buildBrowsePayload($filters))
            : $this->buildBrowsePayload($filters);

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=20, s-maxage=60, stale-while-revalidate=40');
    }

    public function popular(Request $request)
    {
        $limit = (int) $request->integer('limit', 60);
        $cacheKey = 'api:popular:'.max(1, min($limit, 200));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(90), fn (): array => MangaResource::collection($this->catalogService->popular($limit))->resolve())
            : MangaResource::collection($this->catalogService->popular($limit))->resolve();

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=30, s-maxage=90, stale-while-revalidate=60');
    }

    public function status(Request $request, string $status)
    {
        if (! in_array($status, ['ongoing', 'completed', 'hiatus'], true)) {
            return response()->json(['message' => 'Invalid status value.'], 422);
        }

        $limit = (int) $request->integer('limit', 60);
        $cacheKey = sprintf('api:status:%s:%d', $status, max(1, min($limit, 200)));

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(90), fn (): array => MangaResource::collection($this->catalogService->byStatus($status, $limit))->resolve())
            : MangaResource::collection($this->catalogService->byStatus($status, $limit))->resolve();

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=30, s-maxage=90, stale-while-revalidate=60');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function buildBrowsePayload(array $filters): array
    {
        $paginator = $this->catalogService->browse($filters);

        return [
            'items' => MangaResource::collection($paginator->getCollection())->resolve(),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ];
    }
}
