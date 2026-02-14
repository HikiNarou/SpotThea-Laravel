<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenreUpdateRequest extends FormRequest
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
        $genre = $this->route('genre');
        $genreId = is_object($genre) ? $genre->id : $genre;

        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'slug' => ['sometimes', 'string', 'alpha_dash', 'max:100', Rule::unique('genres', 'slug')->ignore($genreId)],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
        ];
    }
}
