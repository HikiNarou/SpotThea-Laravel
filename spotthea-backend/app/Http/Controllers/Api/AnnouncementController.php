<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\BroadcastAnnouncementResource;
use App\Models\BroadcastAnnouncement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AnnouncementController extends Controller
{
    public function __invoke(Request $request)
    {
        $limit = max(1, min((int) $request->integer('limit', 20), 100));
        $cacheKey = sprintf('api:announcements:%d', $limit);

        $payload = $this->shouldUseCache()
            ? Cache::remember($cacheKey, now()->addSeconds(30), fn (): array => $this->buildPayload($limit))
            : $this->buildPayload($limit);

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=20');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildPayload(int $limit): array
    {
        $announcements = BroadcastAnnouncement::query()
            ->visible()
            ->orderByDesc('published_at')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return [
            'items' => BroadcastAnnouncementResource::collection($announcements)->resolve(),
        ];
    }
}
