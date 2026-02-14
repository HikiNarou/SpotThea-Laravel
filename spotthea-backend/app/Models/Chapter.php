<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = [
        'manga_id',
        'number',
        'title',
        'is_oneshot',
        'volume_number',
        'translation_language',
        'published_at',
        'is_published',
        'pages_count',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'decimal:2',
            'is_oneshot' => 'boolean',
            'volume_number' => 'decimal:2',
            'published_at' => 'datetime',
            'is_published' => 'boolean',
            'pages_count' => 'integer',
        ];
    }

    public function manga(): BelongsTo
    {
        return $this->belongsTo(Manga::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(ChapterPage::class)->orderBy('page_index');
    }

    public function readingHistories(): HasMany
    {
        return $this->hasMany(ReadingHistory::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true);
    }
}
