<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class MangaStoreRequest extends FormRequest
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
        $resolvedSlug = trim($rawSlug) !== '' ? $rawSlug : $rawTitle;

        $this->merge([
            'slug' => Str::slug($resolvedSlug),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'slug' => ['required', 'string', 'min:3', 'max:140', 'alpha_dash', Rule::unique('mangas', 'slug')],
            'title' => ['required', 'string', 'min:2', 'max:255'],
            'alt_title' => ['nullable', 'string', 'max:255'],
            'synopsis' => ['required', 'string', 'min:10'],
            'status' => ['required', Rule::in(['ongoing', 'completed', 'hiatus'])],
            'type' => ['required', Rule::in(['manga', 'manhwa', 'manhua'])],
            'content_rating' => ['required', Rule::in(['safe', 'mature'])],
            'year' => ['nullable', 'integer', 'between:1900,2100'],
            'author' => ['required', 'string', 'max:255'],
            'artist' => ['nullable', 'string', 'max:255'],
            'serialization' => ['nullable', 'string', 'max:255'],
            'original_language' => ['nullable', 'string', 'max:12'],
            'content_warnings' => ['sometimes', 'array'],
            'content_warnings.*' => ['string', 'max:100'],
            'formats' => ['sometimes', 'array'],
            'formats.*' => ['string', 'max:100'],
            'is_published' => ['sometimes', 'boolean'],
            'publish_at' => ['sometimes', 'nullable', 'date'],
            'cover_url' => ['required', 'url', 'max:2048'],
            'banner_url' => ['nullable', 'url', 'max:2048'],
            'featured_rank' => ['nullable', 'integer', 'min:1'],
            'popular_rank' => ['nullable', 'integer', 'min:1'],
            'genres' => ['sometimes', 'array'],
            'genres.*' => ['string', 'max:100'],
            'themes' => ['sometimes', 'array'],
            'themes.*' => ['string', 'max:100'],
        ];
    }
}
