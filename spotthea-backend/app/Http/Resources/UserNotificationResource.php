<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserNotificationResource extends JsonResource
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
            'userId' => (string) $this->user_id,
            'mangaId' => $this->manga_id !== null ? (string) $this->manga_id : null,
            'chapterId' => $this->chapter_id !== null ? (string) $this->chapter_id : null,
            'title' => $this->title,
            'body' => $this->body,
            'isRead' => (bool) $this->is_read,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
