<?php

namespace App\Models;

use App\Support\DatabaseSchemaState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Manga extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'slug',
        'title',
        'alt_title',
        'synopsis',
        'status',
        'type',
        'content_rating',
        'year',
        'author',
        'artist',
        'serialization',
        'original_language',
        'content_warnings',
        'formats',
        'is_published',
        'publish_at',
        'cover_url',
        'banner_url',
        'chapter_count',
        'base_rating',
        'base_rating_count',
        'views',
        'followers',
        'featured_rank',
        'popular_rank',
        'updated_content_at',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'content_warnings' => 'array',
            'formats' => 'array',
            'is_published' => 'boolean',
            'publish_at' => 'datetime',
            'chapter_count' => 'integer',
            'base_rating' => 'decimal:2',
            'base_rating_count' => 'integer',
            'views' => 'integer',
            'followers' => 'integer',
            'featured_rank' => 'integer',
            'popular_rank' => 'integer',
            'updated_content_at' => 'datetime',
        ];
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class, 'manga_genre')->withTimestamps();
    }

    public function themes(): BelongsToMany
    {
        return $this->belongsToMany(Theme::class, 'manga_theme')->withTimestamps();
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    public function latestChapter(): HasOne
    {
        return $this->hasOne(Chapter::class)->ofMany('number', 'max');
    }

    public function firstChapter(): HasOne
    {
        return $this->hasOne(Chapter::class)->ofMany('number', 'min');
    }

    public function libraryEntries(): HasMany
    {
        return $this->hasMany(LibraryEntry::class);
    }

    public function readingHistories(): HasMany
    {
        return $this->hasMany(ReadingHistory::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(MangaRating::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(MangaComment::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(UserNotification::class);
    }

    public function scopeVisible(Builder $query): Builder
    {
        if (! DatabaseSchemaState::hasMangaPublishColumns()) {
            return $query;
        }

        return $query
            ->where('is_published', true)
            ->where(function (Builder $builder): void {
                $builder
                    ->whereNull('publish_at')
                    ->orWhere('publish_at', '<=', now());
            });
    }
}
