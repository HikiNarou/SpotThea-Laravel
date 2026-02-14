<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChapterStoreRequest;
use App\Http\Requests\Admin\ChapterUpdateRequest;
use App\Http\Resources\ChapterResource;
use App\Models\Chapter;
use App\Models\LibraryEntry;
use App\Models\Manga;
use App\Models\UserNotification;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ChapterAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request, Manga $manga)
    {
        $search = trim((string) $request->query('q', ''));
        $sortBy = (string) $request->query('sort_by', 'number');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        $pageSize = max(1, min((int) $request->integer('pageSize', 10), 100));

        $sortableColumns = [
            'number' => 'number',
            'title' => 'title',
            'published_at' => 'published_at',
            'created_at' => 'created_at',
        ];
        $sortColumn = $sortableColumns[$sortBy] ?? 'number';

        $query = Chapter::query()
            ->where('manga_id', $manga->id)
            ->with(['manga', 'pages']);

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('number', 'like', "%{$search}%");
            });
        }

        $query->orderBy($sortColumn, $sortDir);

        if ($sortColumn !== 'number') {
            $query->orderBy('number', $sortDir);
        }

        $paginator = $query->paginate($pageSize);

        return response()->json([
            'items' => ChapterResource::collection($paginator->getCollection()),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ]);
    }

    public function show(Chapter $chapter)
    {
        $chapter->load(['manga', 'pages']);

        return new ChapterResource($chapter);
    }

    public function store(ChapterStoreRequest $request, Manga $manga)
    {
        $payload = $request->validated();
        $user = $request->user();

        $chapter = DB::transaction(function () use ($payload, $manga) {
            $chapter = Chapter::query()->create([
                'manga_id' => $manga->id,
                'number' => $payload['number'],
                'title' => $payload['title'],
                'is_oneshot' => $payload['is_oneshot'] ?? false,
                'volume_number' => $payload['volume_number'] ?? null,
                'translation_language' => strtolower((string) ($payload['translation_language'] ?? 'id')),
                'published_at' => $payload['published_at'] ?? now(),
                'is_published' => $payload['is_published'] ?? true,
                'pages_count' => isset($payload['pages']) ? count($payload['pages']) : 0,
            ]);

            if (isset($payload['pages']) && is_array($payload['pages'])) {
                foreach (array_values($payload['pages']) as $index => $page) {
                    $chapter->pages()->create([
                        'page_index' => $index,
                        'image_url' => $page['image_url'],
                        'width' => $page['width'] ?? null,
                        'height' => $page['height'] ?? null,
                    ]);
                }
            }

            $this->refreshMangaCounters($manga);

            if (($payload['is_published'] ?? true) === true) {
                $this->dispatchChapterNotifications($manga, $chapter);
            }

            return $chapter;
        });

        $chapter->load(['manga', 'pages']);
        $this->auditLogService->log('admin.chapter.created', $user, $chapter, ['manga_id' => $manga->id]);

        return (new ChapterResource($chapter))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(ChapterUpdateRequest $request, Chapter $chapter)
    {
        $payload = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($payload, $chapter): void {
            $chapter->fill([
                'number' => $payload['number'] ?? $chapter->number,
                'title' => $payload['title'] ?? $chapter->title,
                'is_oneshot' => $payload['is_oneshot'] ?? $chapter->is_oneshot,
                'volume_number' => array_key_exists('volume_number', $payload) ? $payload['volume_number'] : $chapter->volume_number,
                'translation_language' => array_key_exists('translation_language', $payload)
                    ? strtolower((string) $payload['translation_language'])
                    : $chapter->translation_language,
                'published_at' => array_key_exists('published_at', $payload) ? $payload['published_at'] : $chapter->published_at,
                'is_published' => $payload['is_published'] ?? $chapter->is_published,
            ]);

            if (isset($payload['pages']) && is_array($payload['pages'])) {
                $chapter->pages()->delete();

                foreach (array_values($payload['pages']) as $index => $page) {
                    $chapter->pages()->create([
                        'page_index' => $index,
                        'image_url' => $page['image_url'],
                        'width' => $page['width'] ?? null,
                        'height' => $page['height'] ?? null,
                    ]);
                }

                $chapter->pages_count = count($payload['pages']);
            } else {
                $chapter->pages_count = $chapter->pages()->count();
            }

            $chapter->save();
            $this->refreshMangaCounters($chapter->manga);
        });

        $chapter->load(['manga', 'pages']);
        $this->auditLogService->log('admin.chapter.updated', $user, $chapter);

        return new ChapterResource($chapter);
    }

    public function destroy(Request $request, Chapter $chapter)
    {
        $manga = $chapter->manga;
        $chapter->delete();

        if ($manga !== null) {
            $this->refreshMangaCounters($manga);
        }

        $this->auditLogService->log('admin.chapter.deleted', $request->user(), $chapter);

        return response()->noContent();
    }

    private function refreshMangaCounters(Manga $manga): void
    {
        $manga->update([
            'chapter_count' => Chapter::query()->where('manga_id', $manga->id)->count(),
            'updated_content_at' => now(),
        ]);
    }

    private function dispatchChapterNotifications(Manga $manga, Chapter $chapter): void
    {
        $followerIds = LibraryEntry::query()
            ->where('manga_id', $manga->id)
            ->where('type', 'following')
            ->pluck('user_id');

        foreach ($followerIds as $userId) {
            UserNotification::query()->create([
                'user_id' => $userId,
                'manga_id' => $manga->id,
                'chapter_id' => $chapter->id,
                'title' => sprintf('Update %s', $manga->title),
                'body' => sprintf('Chapter %.2f - %s tersedia.', (float) $chapter->number, $chapter->title),
                'is_read' => false,
            ]);
        }
    }
}
