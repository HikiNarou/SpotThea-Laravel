<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Chapter;
use App\Models\Manga;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $recentOpenReports = Report::query()
            ->with('reporter')
            ->where('status', 'open')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        return response()->json([
            'kpi' => [
                'mangaCount' => Manga::query()->count(),
                'chapterCount' => Chapter::query()->count(),
                'userCount' => User::query()->count(),
                'openReportCount' => Report::query()->where('status', 'open')->count(),
            ],
            'recentReports' => ReportResource::collection($recentOpenReports),
        ]);
    }
}
