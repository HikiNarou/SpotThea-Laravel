<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ThemeStoreRequest;
use App\Http\Requests\Admin\ThemeUpdateRequest;
use App\Http\Resources\ThemeResource;
use App\Models\Theme;
use App\Support\DatabaseSchemaState;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThemeAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        if (! DatabaseSchemaState::hasThemeTables()) {
            return ThemeResource::collection(collect());
        }

        $query = Theme::query()->withCount('mangas');
        $search = trim((string) $request->query('q', ''));

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return ThemeResource::collection($query->orderBy('name')->get());
    }

    public function store(ThemeStoreRequest $request)
    {
        if (! DatabaseSchemaState::hasThemeTables()) {
            return response()->json([
                'message' => 'Database schema is outdated. Run migrations first.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $theme = Theme::query()->create($request->validated());
        $this->auditLogService->log('admin.theme.created', $request->user(), $theme);

        return (new ThemeResource($theme))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(ThemeUpdateRequest $request, Theme $theme)
    {
        if (! DatabaseSchemaState::hasThemeTables()) {
            return response()->json([
                'message' => 'Database schema is outdated. Run migrations first.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $theme->update($request->validated());
        $this->auditLogService->log('admin.theme.updated', $request->user(), $theme);

        return new ThemeResource($theme->refresh());
    }

    public function destroy(Request $request, Theme $theme)
    {
        if (! DatabaseSchemaState::hasThemeTables()) {
            return response()->json([
                'message' => 'Database schema is outdated. Run migrations first.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $theme->delete();
        $this->auditLogService->log('admin.theme.deleted', $request->user(), $theme);

        return response()->noContent();
    }
}
