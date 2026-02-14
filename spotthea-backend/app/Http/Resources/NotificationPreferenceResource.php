<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationPreferenceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'email' => (bool) $this->email,
            'push' => (bool) $this->push,
            'quietHoursStart' => $this->quiet_hours_start,
            'quietHoursEnd' => $this->quiet_hours_end,
        ];
    }
}
