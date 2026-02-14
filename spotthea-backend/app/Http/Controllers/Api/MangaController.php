<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChapterResource;
use App\Http\Resources\MangaResource;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class MangaController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function show(string $slug)
    {
        $cacheKey = sprintf('api:manga:detail:%s', sha1($slug));

        $detail = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(90), fn () => $this->catalogService->detail($slug))
            : $this->catalogService->detail($slug);

        if ($detail === null) {
            return response()->json(['message' => 'Manga not found.'], 404);
        }

        return response()
            ->json([
                'manga' => (new MangaResource($detail['manga']))->resolve(),
                'chapters' => ChapterResource::collection($detail['chapters'])->resolve(),
                'related' => MangaResource::collection($detail['related'])->resolve(),
            ])
            ->header('Cache-Control', 'public, max-age=30, s-maxage=90, stale-while-revalidate=60');
    }

    public function chapters(Request $request, string $slug)
    {
        $filters = $request->all();
        $cacheKey = sprintf('api:manga:chapters:%s', sha1($slug.'|'.json_encode($filters, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));

        $chapterList = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(60), fn () => $this->catalogService->chapterList($slug, $filters))
            : $this->catalogService->chapterList($slug, $filters);

        if ($chapterList === null) {
            return response()->json(['message' => 'Manga not found.'], 404);
        }

        $paginator = $chapterList['paginator'];

        return response()
            ->json([
                'manga' => (new MangaResource($chapterList['manga']))->resolve(),
                'items' => ChapterResource::collection($paginator->getCollection())->resolve(),
                'page' => $paginator->currentPage(),
                'pageSize' => $paginator->perPage(),
                'total' => $paginator->total(),
                'totalPages' => $paginator->lastPage(),
            ])
            ->header('Cache-Control', 'public, max-age=20, s-maxage=60, stale-while-revalidate=40');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }
}
