<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\GenreAttachRequest;
use App\Http\Requests\Admin\GenreStoreRequest;
use App\Http\Requests\Admin\GenreUpdateRequest;
use App\Http\Resources\GenreResource;
use App\Http\Resources\MangaResource;
use App\Models\Genre;
use App\Models\Manga;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GenreAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $query = Genre::query()->withCount('mangas');
        $search = trim((string) $request->query('q', ''));

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return GenreResource::collection($query->orderBy('name')->get());
    }

    public function store(GenreStoreRequest $request)
    {
        $payload = $request->validated();

        $genre = Genre::query()->create($payload);
        $this->auditLogService->log('admin.genre.created', $request->user(), $genre);

        return (new GenreResource($genre))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(GenreUpdateRequest $request, Genre $genre)
    {
        $genre->update($request->validated());
        $this->auditLogService->log('admin.genre.updated', $request->user(), $genre);

        return new GenreResource($genre->refresh());
    }

    public function destroy(Request $request, Genre $genre)
    {
        $genre->delete();
        $this->auditLogService->log('admin.genre.deleted', $request->user(), $genre);

        return response()->noContent();
    }

    public function attachToManga(GenreAttachRequest $request, Manga $manga)
    {
        $payload = $request->validated();

        $genreIds = collect($payload['genres'])
            ->map(static fn (string $slug): string => trim($slug))
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
        $manga->load(['genres', 'latestChapter', 'firstChapter']);

        $this->auditLogService->log('admin.genre.attached_to_manga', $request->user(), $manga, ['genres' => $payload['genres']]);

        return new MangaResource($manga);
    }
}
