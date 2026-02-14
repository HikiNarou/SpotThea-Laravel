<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BroadcastRequest;
use App\Http\Requests\Admin\PlatformSettingsUpdateRequest;
use App\Http\Requests\Admin\SettingsUpdateRequest;
use App\Http\Resources\BroadcastAnnouncementResource;
use App\Http\Resources\ContactMessageResource;
use App\Http\Resources\UserNotificationResource;
use App\Models\BroadcastAnnouncement;
use App\Models\ContactMessage;
use App\Models\LibraryEntry;
use App\Models\SiteSetting;
use App\Models\User;
use App\Models\UserNotification;
use App\Support\PlatformSettings;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;

class SettingAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index()
    {
        $settings = SiteSetting::query()->orderBy('key')->get();
        $contactMessages = ContactMessage::query()
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'settings' => $settings->map(fn (SiteSetting $setting) => [
                'key' => $setting->key,
                'type' => $setting->type,
                'value' => $setting->typed_value,
            ])->values(),
            'platform' => PlatformSettings::load(),
            'contactMessages' => ContactMessageResource::collection($contactMessages),
        ]);
    }

    public function platform()
    {
        return response()->json([
            'platform' => PlatformSettings::load(),
        ]);
    }

    public function updatePlatform(PlatformSettingsUpdateRequest $request)
    {
        $payload = PlatformSettings::sanitizeInput($request->validated());

        DB::transaction(function () use ($payload): void {
            PlatformSettings::store($payload);
        });

        $this->auditLogService->log('admin.platform_settings.updated', $request->user(), 'SiteSetting', [
            'keys' => array_keys($payload),
        ]);

        return response()->json([
            'platform' => PlatformSettings::load(),
        ]);
    }

    public function update(SettingsUpdateRequest $request)
    {
        $payload = $request->validated();

        DB::transaction(function () use ($payload): void {
            foreach ($payload['settings'] as $entry) {
                SiteSetting::query()->updateOrCreate(
                    ['key' => $entry['key']],
                    [
                        'type' => $entry['type'],
                        'value' => $this->normalizeSettingValue($entry['type'], $entry['value'] ?? null),
                    ],
                );
            }
        });

        $this->auditLogService->log('admin.settings.updated', $request->user(), 'SiteSetting', [
            'count' => count($payload['settings']),
        ]);

        return response()->json([
            'settings' => SiteSetting::query()->orderBy('key')->get()->map(fn (SiteSetting $setting) => [
                'key' => $setting->key,
                'type' => $setting->type,
                'value' => $setting->typed_value,
            ])->values(),
            'platform' => PlatformSettings::load(),
        ]);
    }

    public function broadcast(BroadcastRequest $request)
    {
        $payload = $request->validated();
        $user = $request->user();

        $targetUserIds = collect($payload['user_ids'] ?? [])
            ->map(static fn ($id): int => (int) $id)
            ->unique()
            ->values();

        if ($targetUserIds->isEmpty() && isset($payload['manga_id'])) {
            $targetUserIds = LibraryEntry::query()
                ->where('manga_id', (int) $payload['manga_id'])
                ->where('type', 'following')
                ->pluck('user_id')
                ->map(static fn ($id): int => (int) $id)
                ->values();
        }

        if ($targetUserIds->isEmpty()) {
            $targetUserIds = User::query()
                ->pluck('id')
                ->map(static fn ($id): int => (int) $id)
                ->values();
        }

        $created = [];
        $announcement = DB::transaction(function () use ($payload, $targetUserIds, &$created, $user): BroadcastAnnouncement {
            $announcement = BroadcastAnnouncement::query()->create([
                'title' => $payload['title'],
                'body' => $payload['body'],
                'manga_id' => $payload['manga_id'] ?? null,
                'chapter_id' => $payload['chapter_id'] ?? null,
                'created_by_user_id' => $user?->id,
                'published_at' => now(),
                'expires_at' => $payload['expires_at'] ?? null,
                'is_active' => true,
            ]);

            foreach ($targetUserIds as $targetUserId) {
                $created[] = UserNotification::query()->create([
                    'user_id' => $targetUserId,
                    'manga_id' => $payload['manga_id'] ?? null,
                    'chapter_id' => $payload['chapter_id'] ?? null,
                    'title' => $payload['title'],
                    'body' => $payload['body'],
                    'is_read' => false,
                ]);
            }

            return $announcement;
        });

        $this->auditLogService->log('admin.notification.broadcasted', $user, 'UserNotification', [
            'sent_count' => count($created),
            'announcement_id' => $announcement->id,
        ]);

        return response()->json([
            'sent' => count($created),
            'announcement' => new BroadcastAnnouncementResource($announcement),
            'notifications' => UserNotificationResource::collection(collect($created)),
        ]);
    }

    private function normalizeSettingValue(string $type, mixed $value): ?string
    {
        return match ($type) {
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOL) ? 'true' : 'false',
            'json' => $value === null ? null : json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            default => $value !== null ? (string) $value : null,
        };
    }
}
