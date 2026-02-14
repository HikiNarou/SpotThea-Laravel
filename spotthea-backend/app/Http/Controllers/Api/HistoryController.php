<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\History\HistoryUpsertRequest;
use App\Http\Resources\ReadingHistoryResource;
use App\Models\Chapter;
use App\Models\ReadingHistory;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class HistoryController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $days = $request->integer('days');

        $query = ReadingHistory::query()
            ->where('user_id', $user->id)
            ->with(['manga.genres', 'chapter.manga'])
            ->orderByDesc('updated_at');

        if ($days !== null && $days > 0) {
            $query->where('updated_at', '>=', now()->subDays($days));
        }

        return ReadingHistoryResource::collection($query->get());
    }

    public function upsert(HistoryUpsertRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        $chapter = Chapter::query()
            ->whereKey((int) $payload['chapter_id'])
            ->where('manga_id', (int) $payload['manga_id'])
            ->first();

        if ($chapter === null) {
            return response()->json(['message' => 'Chapter does not belong to manga.'], 422);
        }

        $pageCount = max(0, (int) $chapter->pages_count);
        $maxPageIndex = max(0, $pageCount - 1);
        $pageIndex = min(max((int) $payload['page_index'], 0), $maxPageIndex);
        $progressPct = $pageCount > 0
            ? (int) round((($pageIndex + 1) / $pageCount) * 100)
            : 0;

        $entry = ReadingHistory::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'chapter_id' => (int) $payload['chapter_id'],
            ],
            [
                'manga_id' => (int) $payload['manga_id'],
                'page_index' => $pageIndex,
                'progress_pct' => $progressPct,
            ],
        );

        $entry->load(['manga.genres', 'chapter.manga']);
        $this->auditLogService->log('history.upserted', $user, $entry, $payload);

        return response()->json((new ReadingHistoryResource($entry))->resolve());
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        $count = ReadingHistory::query()
            ->where('user_id', $user->id)
            ->delete();

        $this->auditLogService->log('history.cleared', $user, 'ReadingHistory', ['count' => $count]);

        return response()->json(['deleted' => $count]);
    }

    public function clearByManga(Request $request, int $mangaId)
    {
        $user = $request->user();
        $count = ReadingHistory::query()
            ->where('user_id', $user->id)
            ->where('manga_id', $mangaId)
            ->delete();

        $this->auditLogService->log('history.cleared_by_manga', $user, 'ReadingHistory', [
            'manga_id' => $mangaId,
            'count' => $count,
        ]);

        return response()->json(['deleted' => $count]);
    }
}
