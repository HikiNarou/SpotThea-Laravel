<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChapterPageResource extends JsonResource
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
            'index' => (int) $this->page_index,
            'imageUrl' => $this->image_url,
            'width' => (int) ($this->width ?? 0),
            'height' => (int) ($this->height ?? 0),
        ];
    }
}
