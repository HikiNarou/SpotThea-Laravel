<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MangaCommentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'mangaId' => (string) $this->manga_id,
            'userId' => (string) $this->user_id,
            'username' => $this->user?->username ?? $this->user?->name ?? 'Unknown',
            'avatarUrl' => $this->user?->avatar_url ?? '',
            'content' => $this->content,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
            'likes' => (int) ($this->likes ?? 0),
        ];
    }
}
