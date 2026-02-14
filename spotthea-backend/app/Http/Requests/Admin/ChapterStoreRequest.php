<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ChapterStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'number' => ['required', 'numeric', 'min:0.01', 'max:9999'],
            'title' => ['required', 'string', 'max:255'],
            'is_oneshot' => ['sometimes', 'boolean'],
            'volume_number' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999'],
            'translation_language' => ['sometimes', 'string', 'max:10', 'regex:/^[a-zA-Z-]+$/'],
            'published_at' => ['nullable', 'date'],
            'is_published' => ['sometimes', 'boolean'],
            'pages' => ['sometimes', 'array'],
            'pages.*.image_url' => ['required_with:pages', 'url', 'max:2048'],
            'pages.*.width' => ['sometimes', 'integer', 'min:1', 'max:10000'],
            'pages.*.height' => ['sometimes', 'integer', 'min:1', 'max:10000'],
        ];
    }
}
