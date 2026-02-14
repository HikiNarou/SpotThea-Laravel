<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MangaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $genres = $this->relationLoaded('genres')
            ? $this->genres->pluck('slug')->values()->all()
            : [];
        $themes = $this->relationLoaded('themes')
            ? $this->themes->pluck('slug')->values()->all()
            : [];

        $updatedAt = $this->updated_content_at ?? $this->updated_at;
        $originCountryCode = $this->resolveOriginCountryCode();
        $originCountryLabel = $this->resolveOriginCountryLabel($originCountryCode);

        return [
            'id' => (string) $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'altTitle' => (string) $this->alt_title,
            'synopsis' => $this->synopsis,
            'status' => $this->status,
            'type' => $this->type,
            'contentRating' => $this->content_rating,
            'year' => $this->year !== null ? (int) $this->year : null,
            'author' => $this->author,
            'artist' => $this->artist,
            'serialization' => $this->serialization,
            'originalLanguage' => $this->original_language,
            'genres' => $genres,
            'themes' => $themes,
            'contentWarnings' => array_values(array_filter((array) ($this->content_warnings ?? []), static fn ($item): bool => is_string($item) && trim($item) !== '')),
            'formats' => array_values(array_filter((array) ($this->formats ?? []), static fn ($item): bool => is_string($item) && trim($item) !== '')),
            'isPublished' => (bool) ($this->is_published ?? true),
            'publishAt' => $this->publish_at?->toISOString(),
            'coverUrl' => $this->cover_url,
            'bannerUrl' => $this->banner_url,
            'chapterCount' => (int) ($this->chapter_count ?? 0),
            'baseRating' => (float) ($this->base_rating ?? 0),
            'baseRatingCount' => (int) ($this->base_rating_count ?? 0),
            'views' => (int) ($this->views ?? 0),
            'followers' => (int) ($this->followers ?? 0),
            'updatedAt' => $updatedAt?->toISOString(),
            'featuredRank' => $this->featured_rank !== null ? (int) $this->featured_rank : null,
            'popularRank' => (int) ($this->popular_rank ?? 999),
            'originCountryCode' => $originCountryCode,
            'originCountryLabel' => $originCountryLabel,
            'latestChapter' => $this->when(
                $this->relationLoaded('latestChapter') && $this->latestChapter !== null,
                fn () => new ChapterResource($this->latestChapter),
            ),
            'firstChapter' => $this->when(
                $this->relationLoaded('firstChapter') && $this->firstChapter !== null,
                fn () => new ChapterResource($this->firstChapter),
            ),
        ];
    }

    private function resolveOriginCountryCode(): ?string
    {
        $originalLanguage = strtolower((string) ($this->original_language ?? ''));

        if (in_array($originalLanguage, ['id', 'ind'], true)) {
            return 'ID';
        }

        if (in_array($originalLanguage, ['ja', 'jp'], true)) {
            return 'JP';
        }

        if (in_array($originalLanguage, ['ko', 'kr'], true)) {
            return 'KR';
        }

        if (in_array($originalLanguage, ['zh', 'cn'], true)) {
            return 'CN';
        }

        return match ($this->type) {
            'manga' => 'JP',
            'manhwa' => 'KR',
            'manhua' => 'CN',
            default => null,
        };
    }

    private function resolveOriginCountryLabel(?string $code): ?string
    {
        return match ($code) {
            'JP' => 'Jepang',
            'KR' => 'Korea',
            'CN' => 'China',
            'ID' => 'Indonesia',
            default => null,
        };
    }
}
