<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BroadcastAnnouncementResource extends JsonResource
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
            'title' => $this->title,
            'body' => $this->body,
            'mangaId' => $this->manga_id !== null ? (string) $this->manga_id : null,
            'chapterId' => $this->chapter_id !== null ? (string) $this->chapter_id : null,
            'publishedAt' => $this->published_at?->toISOString(),
            'expiresAt' => $this->expires_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}

