<?php

namespace App\Http\Requests\History;

use Illuminate\Foundation\Http\FormRequest;

class HistoryUpsertRequest extends FormRequest
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
            'manga_id' => ['required', 'integer', 'exists:mangas,id'],
            'chapter_id' => ['required', 'integer', 'exists:chapters,id'],
            'page_index' => ['required', 'integer', 'min:0'],
            'progress_pct' => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}
