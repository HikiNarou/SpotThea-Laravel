<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Models\UserNotification;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $limit = max(1, min((int) $request->integer('limit', 100), 200));

        $query = UserNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        $notifications = $query->limit($limit)->get();

        return response()->json([
            'items' => UserNotificationResource::collection($notifications),
            'unreadCount' => UserNotification::query()
                ->where('user_id', $user->id)
                ->where('is_read', false)
                ->count(),
        ]);
    }

    public function markRead(Request $request, int $notificationId)
    {
        $user = $request->user();
        $notification = UserNotification::query()
            ->where('user_id', $user->id)
            ->findOrFail($notificationId);

        $notification->update(['is_read' => true]);
        $this->auditLogService->log('notification.read', $user, $notification);

        return new UserNotificationResource($notification->refresh());
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();

        $count = UserNotification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $this->auditLogService->log('notification.read_all', $user, 'UserNotification', ['count' => $count]);

        return response()->json(['updated' => $count]);
    }
}
