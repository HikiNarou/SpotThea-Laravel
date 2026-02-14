<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MangaComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'manga_id',
        'user_id',
        'content',
        'likes',
    ];

    protected function casts(): array
    {
        return [
            'likes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function manga(): BelongsTo
    {
        return $this->belongsTo(Manga::class);
    }

    public function likesByUsers(): HasMany
    {
        return $this->hasMany(CommentLike::class, 'comment_id');
    }
}
