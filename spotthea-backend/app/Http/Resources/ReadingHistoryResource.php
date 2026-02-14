<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReadingHistoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'mangaId' => (string) $this->manga_id,
            'chapterId' => (string) $this->chapter_id,
            'pageIndex' => (int) $this->page_index,
            'progressPct' => (int) $this->progress_pct,
            'updatedAt' => $this->updated_at?->toISOString(),
            'manga' => $this->when($this->relationLoaded('manga') && $this->manga !== null, fn () => new MangaResource($this->manga)),
            'chapter' => $this->when($this->relationLoaded('chapter') && $this->chapter !== null, fn () => new ChapterResource($this->chapter)),
        ];
    }
}
