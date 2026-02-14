<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlatformSettingsUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'maintenance_mode' => ['required', 'boolean'],
            'site_name' => ['required', 'string', 'max:80'],
            'site_tagline' => ['nullable', 'string', 'max:120'],
            'logo_url' => ['nullable', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Logo URL harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'favicon_url' => ['nullable', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Favicon URL harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'header_notice_enabled' => ['required', 'boolean'],
            'header_notice_text' => ['nullable', Rule::requiredIf($this->boolean('header_notice_enabled')), 'string', 'max:240'],
            'footer_description' => ['nullable', 'string', 'max:240'],
            'footer_copyright' => ['nullable', 'string', 'max:160'],
            'footer_links' => ['required', 'array', 'min:1', 'max:12'],
            'footer_links.*.label' => ['required', 'string', 'max:40'],
            'footer_links.*.href' => ['required', 'string', 'max:255', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Footer link harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_top_items' => ['present', 'array', 'max:8'],
            'home_ads_top_items.*.image_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Image URL iklan slot pertama harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_top_items.*.target_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Target URL iklan slot pertama harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_top_items.*.alt_text' => ['nullable', 'string', 'max:80'],
            'home_ads_before_latest_items' => ['present', 'array', 'max:4'],
            'home_ads_before_latest_items.*.image_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Image URL iklan slot kedua harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_before_latest_items.*.target_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Target URL iklan slot kedua harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_before_latest_items.*.alt_text' => ['nullable', 'string', 'max:80'],
            'home_ads_overlay_enabled' => ['required', 'boolean'],
            'home_ads_overlay_items' => ['present', 'array', 'max:2'],
            'home_ads_overlay_items.*.image_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Image URL iklan overlay harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_overlay_items.*.target_url' => ['required', 'string', 'max:2048', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $this->isRelativeOrAbsoluteUrl($value)) {
                    $fail('Target URL iklan overlay harus berupa path relatif (/) atau URL http/https yang valid.');
                }
            }],
            'home_ads_overlay_items.*.alt_text' => ['nullable', 'string', 'max:80'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validated($key = null, $default = null): array
    {
        /** @var array<string, mixed> $validated */
        $validated = parent::validated($key, $default);

        return $validated;
    }

    private function isRelativeOrAbsoluteUrl(mixed $value): bool
    {
        if ($value === null) {
            return true;
        }

        if (! is_string($value)) {
            return false;
        }

        $trimmed = trim($value);
        if ($trimmed === '') {
            return true;
        }

        if (str_starts_with($trimmed, '/')) {
            return true;
        }

        return filter_var($trimmed, FILTER_VALIDATE_URL) !== false
            && preg_match('/^https?:\/\//i', $trimmed) === 1;
    }
}
