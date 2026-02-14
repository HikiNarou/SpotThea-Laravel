<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChapterResource;
use App\Http\Resources\GenreResource;
use App\Http\Resources\MangaResource;
use App\Http\Resources\ReadingHistoryResource;
use App\Models\User;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function __invoke(Request $request)
    {
        /** @var User|null $user */
        $user = $request->user('sanctum');
        $isPublicGuest = $user === null;

        $payload = $isPublicGuest && $this->shouldUseCache()
            ? Cache::remember('api:home:guest:v1', now()->addSeconds(90), fn (): array => $this->buildPayload(null))
            : $this->buildPayload($user);

        $response = response()->json($payload);

        if ($isPublicGuest) {
            return $response->header('Cache-Control', 'public, max-age=30, s-maxage=90, stale-while-revalidate=60');
        }

        return $response->header('Cache-Control', 'private, no-store');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }

    private function buildPayload(?User $user): array
    {
        $home = $this->catalogService->home($user);

        return [
            'featured' => MangaResource::collection($home['featured'])->resolve(),
            'latestUpdates' => $home['latestUpdates']->map(fn ($chapter) => [
                'manga' => (new MangaResource($chapter->manga))->resolve(),
                'chapter' => (new ChapterResource($chapter))->resolve(),
            ])->values()->all(),
            'tabs' => [
                'popular' => MangaResource::collection($home['tabs']['popular'])->resolve(),
                'latest' => MangaResource::collection($home['tabs']['latest'])->resolve(),
                'ongoing' => MangaResource::collection($home['tabs']['ongoing'])->resolve(),
                'completed' => MangaResource::collection($home['tabs']['completed'])->resolve(),
            ],
            'genres' => GenreResource::collection($home['genres'])->resolve(),
            'continueReading' => ReadingHistoryResource::collection($home['continueReading'])->resolve(),
        ];
    }
}
