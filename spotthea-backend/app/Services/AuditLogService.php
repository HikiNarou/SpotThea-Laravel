<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function __construct(private readonly Request $request) {}

    public function log(
        string $action,
        ?Authenticatable $actor = null,
        Model|string|null $target = null,
        array $payload = [],
    ): void {
        $targetType = null;
        $targetId = null;

        if ($target instanceof Model) {
            $targetType = class_basename($target::class);
            $targetId = (string) $target->getKey();
        } elseif (is_string($target)) {
            $targetType = $target;
        }

        AuditLog::query()->create([
            'user_id' => $actor?->getAuthIdentifier(),
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'payload' => $payload,
            'ip_address' => $this->request->ip(),
            'user_agent' => substr((string) $this->request->userAgent(), 0, 1000),
        ]);
    }
}
