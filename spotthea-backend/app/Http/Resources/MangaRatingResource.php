<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MangaRatingResource extends JsonResource
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
            'userId' => (string) $this->user_id,
            'value' => (int) $this->value,
            'updatedAt' => $this->updated_at?->toISOString(),
        ];
    }
}
