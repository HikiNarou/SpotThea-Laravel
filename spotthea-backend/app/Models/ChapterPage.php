<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChapterPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'chapter_id',
        'page_index',
        'image_url',
        'width',
        'height',
    ];

    protected function casts(): array
    {
        return [
            'page_index' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
        ];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
}
