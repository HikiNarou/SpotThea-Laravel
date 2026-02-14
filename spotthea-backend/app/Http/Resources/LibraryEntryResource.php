<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LibraryEntryResource extends JsonResource
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
            'type' => $this->type,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
            'manga' => $this->when($this->relationLoaded('manga') && $this->manga !== null, fn () => new MangaResource($this->manga)),
        ];
    }
}
