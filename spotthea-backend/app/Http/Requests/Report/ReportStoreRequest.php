<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['manga', 'chapter', 'page', 'general'])],
            'target_id' => ['nullable', 'string', 'max:255'],
            'reason' => ['required', 'string', 'min:3', 'max:120'],
            'details' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
