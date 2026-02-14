<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\PlatformSettings;
use Illuminate\Support\Facades\Cache;

class SiteSettingController extends Controller
{
    public function __invoke()
    {
        $payload = $this->shouldUseCache()
            ? Cache::remember('api:site-settings:v1', now()->addSeconds(45), fn (): array => [
                'platform' => PlatformSettings::load(),
            ])
            : [
                'platform' => PlatformSettings::load(),
            ];

        return response()
            ->json($payload)
            ->header('Cache-Control', 'public, max-age=15, s-maxage=45, stale-while-revalidate=30');
    }

    private function shouldUseCache(): bool
    {
        return ! app()->runningUnitTests();
    }
}
