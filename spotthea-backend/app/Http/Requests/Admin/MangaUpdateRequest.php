<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class MangaUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $rawSlug = (string) $this->input('slug', '');
        $rawTitle = (string) $this->input('title', '');

        if (trim($rawSlug) !== '') {
            $this->merge([
                'slug' => Str::slug($rawSlug),
            ]);
            return;
        }

        if ($this->has('slug') && trim($rawTitle) !== '') {
            $this->merge([
                'slug' => Str::slug($rawTitle),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $manga = $this->route('manga');
        $mangaId = is_object($manga) ? $manga->id : $manga;

        return [
            'slug' => ['sometimes', 'string', 'min:3', 'max:140', 'alpha_dash', Rule::unique('mangas', 'slug')->ignore($mangaId)],
            'title' => ['sometimes', 'string', 'min:2', 'max:255'],
            'alt_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'synopsis' => ['sometimes', 'string', 'min:10'],
            'status' => ['sometimes', Rule::in(['ongoing', 'completed', 'hiatus'])],
            'type' => ['sometimes', Rule::in(['manga', 'manhwa', 'manhua'])],
            'content_rating' => ['sometimes', Rule::in(['safe', 'mature'])],
            'year' => ['sometimes', 'nullable', 'integer', 'between:1900,2100'],
            'author' => ['sometimes', 'string', 'max:255'],
            'artist' => ['sometimes', 'nullable', 'string', 'max:255'],
            'serialization' => ['sometimes', 'nullable', 'string', 'max:255'],
            'original_language' => ['sometimes', 'nullable', 'string', 'max:12'],
            'content_warnings' => ['sometimes', 'array'],
            'content_warnings.*' => ['string', 'max:100'],
            'formats' => ['sometimes', 'array'],
            'formats.*' => ['string', 'max:100'],
            'is_published' => ['sometimes', 'boolean'],
            'publish_at' => ['sometimes', 'nullable', 'date'],
            'cover_url' => ['sometimes', 'url', 'max:2048'],
            'banner_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'featured_rank' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'popular_rank' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'genres' => ['sometimes', 'array'],
            'genres.*' => ['string', 'max:100'],
            'themes' => ['sometimes', 'array'],
            'themes.*' => ['string', 'max:100'],
        ];
    }
}
