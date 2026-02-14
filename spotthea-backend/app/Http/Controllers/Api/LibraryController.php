<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Library\LibraryMoveRequest;
use App\Http\Requests\Library\LibraryUpsertRequest;
use App\Http\Resources\LibraryEntryResource;
use App\Models\LibraryEntry;
use App\Models\Manga;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LibraryController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $type = $request->query('type');
        $sort = (string) $request->query('sort', 'updated');

        $query = LibraryEntry::query()
            ->where('user_id', $user->id)
            ->with(['manga.genres', 'manga.latestChapter', 'manga.firstChapter']);

        if (is_string($type) && $type !== '') {
            $query->where('type', $type);
        }

        match ($sort) {
            'title' => $query
                ->join('mangas', 'mangas.id', '=', 'library_entries.manga_id')
                ->orderBy('mangas.title')
                ->select('library_entries.*'),
            default => $query->orderByDesc('updated_at'),
        };

        return LibraryEntryResource::collection($query->get());
    }

    public function upsert(LibraryUpsertRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();
        $active = (bool) ($payload['active'] ?? true);

        if (! $active) {
            LibraryEntry::query()
                ->where('user_id', $user->id)
                ->where('manga_id', $payload['manga_id'])
                ->where('type', $payload['type'])
                ->delete();

            $this->refreshFollowersCount((int) $payload['manga_id']);
            $this->auditLogService->log('library.removed', $user, 'LibraryEntry', $payload);

            return response()->json(['active' => false]);
        }

        $entry = LibraryEntry::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'manga_id' => $payload['manga_id'],
                'type' => $payload['type'],
            ],
            [],
        );

        $entry->load(['manga.genres', 'manga.latestChapter', 'manga.firstChapter']);
        $this->refreshFollowersCount((int) $payload['manga_id']);
        $this->auditLogService->log('library.upserted', $user, $entry, $payload);

        return response()->json((new LibraryEntryResource($entry))->resolve());
    }

    public function move(LibraryMoveRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        $entry = DB::transaction(function () use ($payload, $user) {
            LibraryEntry::query()
                ->where('user_id', $user->id)
                ->where('manga_id', $payload['manga_id'])
                ->delete();

            return LibraryEntry::query()->create([
                'user_id' => $user->id,
                'manga_id' => $payload['manga_id'],
                'type' => $payload['to_type'],
            ]);
        });

        $entry->load(['manga.genres', 'manga.latestChapter', 'manga.firstChapter']);
        $this->refreshFollowersCount((int) $payload['manga_id']);
        $this->auditLogService->log('library.moved', $user, $entry, $payload);

        return response()->json((new LibraryEntryResource($entry))->resolve());
    }

    public function destroy(Request $request, int $mangaId, string $type)
    {
        $user = $request->user();
        $deleted = LibraryEntry::query()
            ->where('user_id', $user->id)
            ->where('manga_id', $mangaId)
            ->where('type', $type)
            ->delete();

        $this->refreshFollowersCount($mangaId);

        if ($deleted > 0) {
            $this->auditLogService->log('library.deleted', $user, 'LibraryEntry', [
                'manga_id' => $mangaId,
                'type' => $type,
            ]);
        }

        return response()->noContent();
    }

    private function refreshFollowersCount(int $mangaId): void
    {
        $followers = LibraryEntry::query()
            ->where('manga_id', $mangaId)
            ->where('type', 'following')
            ->count();

        Manga::query()->whereKey($mangaId)->update(['followers' => $followers]);
    }
}
