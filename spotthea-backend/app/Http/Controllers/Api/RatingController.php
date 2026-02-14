<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rating\RatingUpsertRequest;
use App\Models\Manga;
use App\Models\MangaRating;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function upsert(RatingUpsertRequest $request, int $mangaId)
    {
        $user = $request->user();
        $payload = $request->validated();

        $manga = Manga::query()->findOrFail($mangaId);

        $rating = MangaRating::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'manga_id' => $manga->id,
            ],
            [
                'value' => (int) $payload['value'],
            ],
        );

        $this->auditLogService->log('rating.upserted', $user, $rating, ['manga_id' => $mangaId]);

        return response()->json($this->buildSummary($mangaId, $user->id));
    }

    public function destroy(Request $request, int $mangaId)
    {
        $user = $request->user();
        MangaRating::query()
            ->where('user_id', $user->id)
            ->where('manga_id', $mangaId)
            ->delete();

        $this->auditLogService->log('rating.deleted', $user, 'MangaRating', ['manga_id' => $mangaId]);

        return response()->json($this->buildSummary($mangaId, $user->id));
    }

    public function summary(Request $request, int $mangaId)
    {
        return response()->json($this->buildSummary($mangaId, $request->user()?->id));
    }

    private function buildSummary(int $mangaId, ?int $userId): array
    {
        $query = MangaRating::query()->where('manga_id', $mangaId);

        $count = (int) $query->count();
        $rating = $count > 0 ? round((float) $query->avg('value'), 2) : 0.0;

        $userRating = null;
        if ($userId !== null) {
            $userRating = MangaRating::query()
                ->where('manga_id', $mangaId)
                ->where('user_id', $userId)
                ->value('value');
        }

        return [
            'rating' => $rating,
            'count' => $count,
            'userRating' => $userRating !== null ? (int) $userRating : null,
        ];
    }
}
