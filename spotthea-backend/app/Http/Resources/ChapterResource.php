<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChapterResource extends JsonResource
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
            'mangaSlug' => $this->when(
                $this->relationLoaded('manga') && $this->manga !== null,
                fn () => $this->manga->slug,
                $this->manga?->slug,
            ),
            'mangaTitle' => $this->when(
                $this->relationLoaded('manga') && $this->manga !== null,
                fn () => $this->manga->title,
                $this->manga?->title,
            ),
            'number' => (float) $this->number,
            'title' => $this->title,
            'isOneshot' => (bool) $this->is_oneshot,
            'volumeNumber' => $this->volume_number !== null ? (float) $this->volume_number : null,
            'translationLanguage' => (string) ($this->translation_language ?? 'id'),
            'publishedAt' => $this->published_at?->toISOString(),
            'isPublished' => (bool) $this->is_published,
            'pages' => $this->when($this->relationLoaded('pages'), fn () => ChapterPageResource::collection($this->pages)),
            'pagesCount' => (int) ($this->pages_count ?? ($this->relationLoaded('pages') ? $this->pages->count() : 0)),
        ];
    }
}
