<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use JsonException;

class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'type',
        'value',
    ];

    public function getTypedValueAttribute(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOL),
            'json' => $this->decodeJsonValue($this->value),
            default => $this->value,
        };
    }

    private function decodeJsonValue(?string $value): mixed
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        try {
            return json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }
    }
}
