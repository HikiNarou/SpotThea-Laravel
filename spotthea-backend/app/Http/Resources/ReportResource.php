<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
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
            'reporterUserId' => $this->reporter_user_id !== null ? (string) $this->reporter_user_id : null,
            'type' => $this->type,
            'targetId' => $this->target_id,
            'reason' => $this->reason,
            'details' => $this->details,
            'createdAt' => $this->created_at?->toISOString(),
            'status' => $this->status,
        ];
    }
}
