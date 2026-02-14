<?php

namespace App\Http\Requests\Admin;

use App\Support\DatabaseSchemaState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ThemeStoreRequest extends FormRequest
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
        $name = (string) $this->input('name', '');
        $slug = (string) $this->input('slug', '');
        $base = trim($slug) !== '' ? $slug : $name;

        $this->merge([
            'slug' => Str::slug($base),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $slugRules = ['required', 'string', 'min:2', 'max:100', 'alpha_dash'];
        if (DatabaseSchemaState::hasThemeTables()) {
            $slugRules[] = Rule::unique('themes', 'slug');
        }

        return [
            'name' => ['required', 'string', 'min:2', 'max:100'],
            'slug' => $slugRules,
            'description' => ['nullable', 'string', 'max:255'],
        ];
    }
}
