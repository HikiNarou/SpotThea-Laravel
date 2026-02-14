<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Comment\CommentStoreRequest;
use App\Http\Resources\MangaCommentResource;
use App\Models\CommentLike;
use App\Models\Manga;
use App\Models\MangaComment;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CommentController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request, int $mangaId)
    {
        $limit = max(1, min((int) $request->integer('limit', 100), 200));

        $comments = MangaComment::query()
            ->where('manga_id', $mangaId)
            ->with('user')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        return MangaCommentResource::collection($comments);
    }

    public function store(CommentStoreRequest $request, int $mangaId)
    {
        $user = $request->user();
        $payload = $request->validated();

        $manga = Manga::query()->findOrFail($mangaId);

        $comment = MangaComment::query()->create([
            'manga_id' => $manga->id,
            'user_id' => $user->id,
            'content' => $payload['content'],
            'likes' => 0,
        ]);

        $comment->load('user');
        $this->auditLogService->log('comment.created', $user, $comment, ['manga_id' => $mangaId]);

        return (new MangaCommentResource($comment))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function destroy(Request $request, int $commentId)
    {
        $user = $request->user();
        $comment = MangaComment::query()->withTrashed()->findOrFail($commentId);

        $canDelete = $comment->user_id === $user->id || in_array($user->role, ['moderator', 'admin'], true);
        if (! $canDelete) {
            abort(Response::HTTP_FORBIDDEN, 'You cannot delete this comment.');
        }

        $comment->delete();
        $this->auditLogService->log('comment.deleted', $user, $comment);

        return response()->noContent();
    }

    public function toggleLike(Request $request, int $commentId)
    {
        $user = $request->user();
        $comment = MangaComment::query()->findOrFail($commentId);

        $liked = DB::transaction(function () use ($comment, $user): bool {
            $existing = CommentLike::query()
                ->where('comment_id', $comment->id)
                ->where('user_id', $user->id)
                ->first();

            if ($existing !== null) {
                $existing->delete();
                $comment->decrement('likes');
                $comment->refresh();

                if ($comment->likes < 0) {
                    $comment->update(['likes' => 0]);
                }

                return false;
            }

            CommentLike::query()->create([
                'comment_id' => $comment->id,
                'user_id' => $user->id,
            ]);

            $comment->increment('likes');

            return true;
        });

        $comment->refresh()->load('user');
        $this->auditLogService->log('comment.like_toggled', $user, $comment, ['liked' => $liked]);

        return response()->json([
            'liked' => $liked,
            'comment' => new MangaCommentResource($comment),
        ]);
    }
}
