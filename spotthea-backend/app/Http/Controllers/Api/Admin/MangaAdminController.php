<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MangaStoreRequest;
use App\Http\Requests\Admin\MangaUpdateRequest;
use App\Http\Resources\MangaResource;
use App\Models\Genre;
use App\Models\Manga;
use App\Models\Theme;
use App\Support\DatabaseSchemaState;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class MangaAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $query = Manga::query()->with($this->mangaRelations());
        $search = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', '');
        $type = (string) $request->query('type', '');
        $contentRating = (string) $request->query('content_rating', '');
        $sortBy = (string) $request->query('sort_by', 'updated');
        $sortDir = strtolower((string) $request->query('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $sortColumnByKey = [
            'updated' => 'updated_content_at',
            'title' => 'title',
            'created' => 'created_at',
            'chapter_count' => 'chapter_count',
            'popular_rank' => 'popular_rank',
            'year' => 'year',
        ];
        $sortColumn = $sortColumnByKey[$sortBy] ?? 'updated_content_at';

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['ongoing', 'completed', 'hiatus'], true)) {
            $query->where('status', $status);
        }

        if (in_array($type, ['manga', 'manhwa', 'manhua'], true)) {
            $query->where('type', $type);
        }

        if (in_array($contentRating, ['safe', 'mature'], true)) {
            $query->where('content_rating', $contentRating);
        }

        if ($sortColumn === 'updated_content_at') {
            $query->orderByRaw(sprintf('COALESCE(updated_content_at, updated_at) %s', $sortDir));
        } else {
            $query->orderBy($sortColumn, $sortDir);
        }

        if ($sortColumn !== 'updated_content_at' || $sortDir !== 'desc') {
            $query->orderByDesc('updated_content_at');
        }

        $paginator = $query
            ->paginate(max(1, min((int) $request->integer('pageSize', 20), 100)));

        return response()->json([
            'items' => MangaResource::collection($paginator->getCollection()),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ]);
    }

    public function show(Manga $manga)
    {
        $manga->load([
            ...$this->mangaRelations(),
            'chapters.pages',
        ]);

        return response()->json([
            'manga' => new MangaResource($manga),
        ]);
    }

    public function store(MangaStoreRequest $request)
    {
        $payload = $request->validated();
        $user = $request->user();

        $manga = DB::transaction(function () use ($payload) {
            $attributes = [
                'slug' => $payload['slug'],
                'title' => $payload['title'],
                'alt_title' => $payload['alt_title'] ?? '',
                'synopsis' => $payload['synopsis'],
                'status' => $payload['status'],
                'type' => $payload['type'],
                'content_rating' => $payload['content_rating'],
                'year' => $payload['year'] ?? null,
                'author' => $payload['author'],
                'artist' => $payload['artist'] ?? '',
                'serialization' => $payload['serialization'] ?? '',
                'cover_url' => $payload['cover_url'],
                'banner_url' => $payload['banner_url'] ?? $payload['cover_url'],
                'featured_rank' => $payload['featured_rank'] ?? null,
                'popular_rank' => $payload['popular_rank'] ?? 999,
                'updated_content_at' => now(),
            ];

            if (DatabaseSchemaState::hasMangaTagColumns()) {
                $attributes['original_language'] = $payload['original_language'] ?? null;
                $attributes['content_warnings'] = $payload['content_warnings'] ?? [];
                $attributes['formats'] = $payload['formats'] ?? [];
            }

            if (DatabaseSchemaState::hasMangaPublishColumns()) {
                $attributes['is_published'] = $payload['is_published'] ?? true;
                $attributes['publish_at'] = $payload['publish_at'] ?? null;
            }

            $manga = Manga::query()->create($attributes);

            $this->syncGenres($manga, $payload['genres'] ?? []);
            $this->syncThemes($manga, $payload['themes'] ?? []);

            return $manga;
        });

        $manga->load($this->mangaRelations());
        $this->auditLogService->log('admin.manga.created', $user, $manga, ['slug' => $manga->slug]);

        return (new MangaResource($manga))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(MangaUpdateRequest $request, Manga $manga)
    {
        $payload = $request->validated();
        $user = $request->user();

        DB::transaction(function () use ($manga, $payload): void {
            $attributes = [
                'slug' => $payload['slug'] ?? $manga->slug,
                'title' => $payload['title'] ?? $manga->title,
                'alt_title' => $payload['alt_title'] ?? $manga->alt_title,
                'synopsis' => $payload['synopsis'] ?? $manga->synopsis,
                'status' => $payload['status'] ?? $manga->status,
                'type' => $payload['type'] ?? $manga->type,
                'content_rating' => $payload['content_rating'] ?? $manga->content_rating,
                'year' => array_key_exists('year', $payload) ? $payload['year'] : $manga->year,
                'author' => $payload['author'] ?? $manga->author,
                'artist' => $payload['artist'] ?? $manga->artist,
                'serialization' => $payload['serialization'] ?? $manga->serialization,
                'cover_url' => $payload['cover_url'] ?? $manga->cover_url,
                'banner_url' => $payload['banner_url'] ?? $manga->banner_url,
                'featured_rank' => array_key_exists('featured_rank', $payload) ? $payload['featured_rank'] : $manga->featured_rank,
                'popular_rank' => $payload['popular_rank'] ?? $manga->popular_rank,
                'updated_content_at' => now(),
            ];

            if (DatabaseSchemaState::hasMangaTagColumns()) {
                $attributes['original_language'] = array_key_exists('original_language', $payload) ? $payload['original_language'] : $manga->original_language;
                $attributes['content_warnings'] = array_key_exists('content_warnings', $payload) ? ($payload['content_warnings'] ?? []) : $manga->content_warnings;
                $attributes['formats'] = array_key_exists('formats', $payload) ? ($payload['formats'] ?? []) : $manga->formats;
            }

            if (DatabaseSchemaState::hasMangaPublishColumns()) {
                $attributes['is_published'] = array_key_exists('is_published', $payload) ? (bool) $payload['is_published'] : $manga->is_published;
                $attributes['publish_at'] = array_key_exists('publish_at', $payload) ? $payload['publish_at'] : $manga->publish_at;
            }

            $manga->fill($attributes)->save();

            if (array_key_exists('genres', $payload)) {
                $this->syncGenres($manga, $payload['genres']);
            }

            if (array_key_exists('themes', $payload)) {
                $this->syncThemes($manga, $payload['themes'] ?? []);
            }
        });

        $manga->load($this->mangaRelations());
        $this->auditLogService->log('admin.manga.updated', $user, $manga, ['slug' => $manga->slug]);

        return new MangaResource($manga);
    }

    public function destroy(Request $request, Manga $manga)
    {
        $manga->delete();
        $this->auditLogService->log('admin.manga.deleted', $request->user(), $manga, ['slug' => $manga->slug]);

        return response()->noContent();
    }

    /**
     * @param  list<string>  $genres
     */
    private function syncGenres(Manga $manga, array $genres): void
    {
        $genreIds = collect($genres)
            ->map(static fn (string $slug): string => Str::slug(trim($slug)))
            ->filter(static fn (string $slug): bool => $slug !== '')
            ->map(function (string $slug): int {
                $genre = Genre::query()->firstOrCreate(
                    ['slug' => $slug],
                    ['name' => ucwords(str_replace('-', ' ', $slug))],
                );

                return $genre->id;
            })
            ->values()
            ->all();

        $manga->genres()->sync($genreIds);
    }

    /**
     * @param  list<string>  $themes
     */
    private function syncThemes(Manga $manga, array $themes): void
    {
        if (! DatabaseSchemaState::hasThemeTables()) {
            return;
        }

        $themeIds = collect($themes)
            ->map(static fn (string $slug): string => Str::slug(trim($slug)))
            ->filter(static fn (string $slug): bool => $slug !== '')
            ->map(function (string $slug): int {
                $theme = Theme::query()->firstOrCreate(
                    ['slug' => $slug],
                    ['name' => ucwords(str_replace('-', ' ', $slug))],
                );

                return $theme->id;
            })
            ->values()
            ->all();

        $manga->themes()->sync($themeIds);
    }

    /**
     * @return list<string>
     */
    private function mangaRelations(): array
    {
        $relations = ['genres', 'latestChapter', 'firstChapter'];

        if (DatabaseSchemaState::hasThemeTables()) {
            $relations[] = 'themes';
        }

        return $relations;
    }
}
