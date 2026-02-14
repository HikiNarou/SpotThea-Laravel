<?php

namespace App\Http\Requests\Admin;

use App\Support\DatabaseSchemaState;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ThemeUpdateRequest extends FormRequest
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
        if (! $this->has('slug') && ! $this->has('name')) {
            return;
        }

        $name = (string) $this->input('name', '');
        $slug = (string) $this->input('slug', '');
        $base = trim($slug) !== '' ? $slug : $name;

        if (trim($base) === '') {
            return;
        }

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
        $theme = $this->route('theme');
        $themeId = is_object($theme) ? $theme->id : $theme;
        $slugRules = ['sometimes', 'string', 'min:2', 'max:100', 'alpha_dash'];
        if (DatabaseSchemaState::hasThemeTables()) {
            $slugRules[] = Rule::unique('themes', 'slug')->ignore($themeId);
        }

        return [
            'name' => ['sometimes', 'string', 'min:2', 'max:100'],
            'slug' => $slugRules,
            'description' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
