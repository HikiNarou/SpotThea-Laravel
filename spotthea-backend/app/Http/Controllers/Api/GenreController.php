<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GenreResource;
use App\Services\CatalogService;
use Illuminate\Support\Facades\Cache;

class GenreController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function __invoke()
    {
        $payload = $this->shouldUseCache()
            ? Cache::remember('api:genres:v1', now()->addSeconds(120), fn (): array => GenreResource::collection($this->catalogService->genres())->resolve())
            : GenreResource::collection($this->catalogService->genres())->resolve();

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=60');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }
}
