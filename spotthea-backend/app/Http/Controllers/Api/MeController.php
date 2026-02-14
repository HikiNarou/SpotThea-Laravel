<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MangaCommentResource;
use App\Http\Resources\MangaRatingResource;
use App\Http\Requests\Me\PasswordUpdateRequest;
use App\Http\Requests\Me\ProfileUpdateRequest;
use App\Http\Resources\LibraryEntryResource;
use App\Http\Resources\ReadingHistoryResource;
use App\Http\Resources\UserResource;
use App\Models\LibraryEntry;
use App\Models\MangaComment;
use App\Models\MangaRating;
use App\Models\ReadingHistory;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class MeController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function show(Request $request)
    {
        $user = $request->user()?->fresh();

        return new UserResource($user ?? $request->user());
    }

    public function overview(Request $request)
    {
        $user = $request->user();

        $history = ReadingHistory::query()
            ->where('user_id', $user->id)
            ->with(['manga.genres', 'chapter.manga'])
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get();

        $library = LibraryEntry::query()
            ->where('user_id', $user->id)
            ->with('manga.genres')
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get();

        return response()->json([
            'user' => new UserResource($user),
            'stats' => [
                'historyCount' => ReadingHistory::query()->where('user_id', $user->id)->count(),
                'libraryCount' => LibraryEntry::query()->where('user_id', $user->id)->count(),
                'followingCount' => LibraryEntry::query()
                    ->where('user_id', $user->id)
                    ->where('type', 'following')
                    ->count(),
            ],
            'history' => ReadingHistoryResource::collection($history),
            'library' => LibraryEntryResource::collection($library),
        ]);
    }

    public function ratings(Request $request)
    {
        $user = $request->user();

        $ratings = MangaRating::query()
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->get();

        return MangaRatingResource::collection($ratings);
    }

    public function comments(Request $request)
    {
        $user = $request->user();

        $comments = MangaComment::query()
            ->where('user_id', $user->id)
            ->with('user')
            ->orderByDesc('created_at')
            ->get();

        return MangaCommentResource::collection($comments);
    }

    public function updateProfile(ProfileUpdateRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        $user->update([
            'username' => $payload['username'],
            'name' => $payload['username'],
            'bio' => $payload['bio'] ?? null,
            'avatar_url' => $payload['avatar_url'] ?? $user->avatar_url,
            'preferred_locale' => $payload['preferred_locale'],
        ]);

        $this->auditLogService->log('me.profile_updated', $user, $user);

        return new UserResource($user->refresh());
    }

    public function updatePassword(PasswordUpdateRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        if (! Hash::check($payload['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is invalid.'],
            ]);
        }

        $user->update([
            'password' => $payload['password'],
        ]);

        $this->auditLogService->log('me.password_updated', $user, $user);

        return response()->json([
            'message' => 'Password updated successfully.',
        ]);
    }
}
