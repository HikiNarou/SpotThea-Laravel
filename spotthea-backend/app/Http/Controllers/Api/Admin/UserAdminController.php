<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserRoleUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class UserAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $query = User::query();
        $search = trim((string) $request->query('q', ''));
        $role = $request->query('role');

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (is_string($role) && $role !== '') {
            $query->where('role', $role);
        }

        $paginator = $query->orderByDesc('created_at')
            ->paginate(max(1, min((int) $request->integer('pageSize', 20), 100)));

        return response()->json([
            'items' => UserResource::collection($paginator->getCollection()),
            'page' => $paginator->currentPage(),
            'pageSize' => $paginator->perPage(),
            'total' => $paginator->total(),
            'totalPages' => $paginator->lastPage(),
        ]);
    }

    public function show(User $user)
    {
        return new UserResource($user);
    }

    public function updateRole(UserRoleUpdateRequest $request, User $user)
    {
        $payload = $request->validated();

        $user->update(['role' => $payload['role']]);
        $this->auditLogService->log('admin.user.role_updated', $request->user(), $user, ['role' => $payload['role']]);

        return new UserResource($user->refresh());
    }
}
