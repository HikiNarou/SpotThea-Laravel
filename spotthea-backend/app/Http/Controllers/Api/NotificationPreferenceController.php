<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notification\NotificationPreferenceUpdateRequest;
use App\Http\Resources\NotificationPreferenceResource;
use App\Models\NotificationPreference;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function show(Request $request)
    {
        $preference = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $request->user()->id],
            ['email' => true, 'push' => false, 'quiet_hours_start' => '22:00', 'quiet_hours_end' => '07:00'],
        );

        return new NotificationPreferenceResource($preference);
    }

    public function update(NotificationPreferenceUpdateRequest $request)
    {
        $payload = $request->validated();
        $user = $request->user();

        $preference = NotificationPreference::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['email' => true, 'push' => false, 'quiet_hours_start' => '22:00', 'quiet_hours_end' => '07:00'],
        );

        $preference->update($payload);
        $this->auditLogService->log('notification.preference_updated', $user, $preference, $payload);

        return new NotificationPreferenceResource($preference->refresh());
    }
}
