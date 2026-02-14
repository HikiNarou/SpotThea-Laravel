<?php

namespace App\Support;

use App\Models\SiteSetting;

class PlatformSettings
{
    private const DEFAULT_HOME_ADS_TOP_ITEMS = [];

    private const DEFAULT_HOME_ADS_BEFORE_LATEST_ITEMS = [];

    private const DEFAULT_HOME_ADS_OVERLAY_ITEMS = [];

    /**
     * @var array<string, array{type:'string'|'boolean'|'json',default:mixed}>
     */
    private const DEFINITION = [
        'maintenance_mode' => [
            'type' => 'boolean',
            'default' => false,
        ],
        'site_name' => [
            'type' => 'string',
            'default' => 'Spotthea',
        ],
        'site_tagline' => [
            'type' => 'string',
            'default' => 'Manga Reader',
        ],
        'logo_url' => [
            'type' => 'string',
            'default' => null,
        ],
        'favicon_url' => [
            'type' => 'string',
            'default' => null,
        ],
        'header_notice_enabled' => [
            'type' => 'boolean',
            'default' => false,
        ],
        'header_notice_text' => [
            'type' => 'string',
            'default' => '',
        ],
        'footer_description' => [
            'type' => 'string',
            'default' => 'Platform membaca manga dengan pengalaman reader fokus mobile dan desktop.',
        ],
        'footer_copyright' => [
            'type' => 'string',
            'default' => '© Spotthea',
        ],
        'footer_links' => [
            'type' => 'json',
            'default' => [
                ['label' => 'About', 'href' => '/about'],
                ['label' => 'DMCA', 'href' => '/dmca'],
                ['label' => 'Privacy', 'href' => '/privacy'],
                ['label' => 'Terms', 'href' => '/terms'],
                ['label' => 'Contact', 'href' => '/contact'],
                ['label' => 'Report', 'href' => '/report'],
            ],
        ],
        'home_ads_top_items' => [
            'type' => 'json',
            'default' => self::DEFAULT_HOME_ADS_TOP_ITEMS,
        ],
        'home_ads_before_latest_items' => [
            'type' => 'json',
            'default' => self::DEFAULT_HOME_ADS_BEFORE_LATEST_ITEMS,
        ],
        'home_ads_overlay_enabled' => [
            'type' => 'boolean',
            'default' => false,
        ],
        'home_ads_overlay_items' => [
            'type' => 'json',
            'default' => self::DEFAULT_HOME_ADS_OVERLAY_ITEMS,
        ],
    ];

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        $defaults = [];

        foreach (self::DEFINITION as $key => $definition) {
            $defaults[$key] = $definition['default'];
        }

        return $defaults;
    }

    /**
     * @return array<int, string>
     */
    public static function keys(): array
    {
        return array_keys(self::DEFINITION);
    }

    /**
     * @return array<string, mixed>
     */
    public static function load(): array
    {
        $rows = SiteSetting::query()
            ->whereIn('key', self::keys())
            ->get()
            ->keyBy('key');

        $settings = self::defaults();

        foreach (self::DEFINITION as $key => $definition) {
            $row = $rows->get($key);
            if (! $row instanceof SiteSetting) {
                continue;
            }

            $settings[$key] = self::normalizeLoadedValue($key, $row->typed_value);
        }

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public static function sanitizeInput(array $payload): array
    {
        $settings = self::defaults();

        foreach (self::DEFINITION as $key => $definition) {
            if (!array_key_exists($key, $payload)) {
                continue;
            }

            $settings[$key] = self::normalizeInputValue($key, $payload[$key]);
        }

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public static function store(array $settings): void
    {
        $normalized = self::sanitizeInput($settings);

        foreach (self::DEFINITION as $key => $definition) {
            $value = $normalized[$key];

            SiteSetting::query()->updateOrCreate(
                ['key' => $key],
                [
                    'type' => $definition['type'],
                    'value' => self::serializeValue($definition['type'], $value),
                ],
            );
        }
    }

    private static function normalizeLoadedValue(string $key, mixed $value): mixed
    {
        return match ($key) {
            'maintenance_mode', 'header_notice_enabled', 'home_ads_overlay_enabled' => (bool) $value,
            'site_name', 'site_tagline', 'header_notice_text', 'footer_description', 'footer_copyright' => trim((string) ($value ?? '')),
            'logo_url', 'favicon_url' => self::normalizeNullableString($value),
            'footer_links' => self::normalizeFooterLinks($value),
            'home_ads_top_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_TOP_ITEMS, 8),
            'home_ads_before_latest_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_BEFORE_LATEST_ITEMS, 4),
            'home_ads_overlay_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_OVERLAY_ITEMS, 2),
            default => $value,
        };
    }

    private static function normalizeInputValue(string $key, mixed $value): mixed
    {
        return match ($key) {
            'maintenance_mode', 'header_notice_enabled', 'home_ads_overlay_enabled' => (bool) $value,
            'site_name', 'site_tagline', 'header_notice_text', 'footer_description', 'footer_copyright' => trim((string) $value),
            'logo_url', 'favicon_url' => self::normalizeNullableString($value),
            'footer_links' => self::normalizeFooterLinks($value),
            'home_ads_top_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_TOP_ITEMS, 8),
            'home_ads_before_latest_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_BEFORE_LATEST_ITEMS, 4),
            'home_ads_overlay_items' => self::normalizeAdItems($value, self::DEFAULT_HOME_ADS_OVERLAY_ITEMS, 2),
            default => $value,
        };
    }

    private static function normalizeNullableString(mixed $value): ?string
    {
        $string = trim((string) ($value ?? ''));

        return $string !== '' ? $string : null;
    }

    /**
     * @return array<int, array{label:string,href:string}>
     */
    private static function normalizeFooterLinks(mixed $value): array
    {
        if (! is_array($value)) {
            return self::DEFINITION['footer_links']['default'];
        }

        $links = [];

        foreach ($value as $item) {
            if (! is_array($item)) {
                continue;
            }

            $label = trim((string) ($item['label'] ?? ''));
            $href = trim((string) ($item['href'] ?? ''));

            if ($label === '' || $href === '') {
                continue;
            }

            $links[] = [
                'label' => $label,
                'href' => $href,
            ];
        }

        if (count($links) === 0) {
            return self::DEFINITION['footer_links']['default'];
        }

        return array_values($links);
    }

    /**
     * @param  mixed  $value
     * @param  array<int, array{image_url:string,target_url:string,alt_text:string}>  $fallback
     * @return array<int, array{image_url:string,target_url:string,alt_text:string}>
     */
    private static function normalizeAdItems(mixed $value, array $fallback, int $maxItems): array
    {
        if (! is_array($value)) {
            return array_slice(array_values($fallback), 0, $maxItems);
        }

        $ads = [];

        foreach ($value as $item) {
            if (! is_array($item)) {
                continue;
            }

            $imageUrl = trim((string) ($item['image_url'] ?? ''));
            $targetUrl = trim((string) ($item['target_url'] ?? ''));
            $altText = trim((string) ($item['alt_text'] ?? ''));

            if ($imageUrl === '' || self::isLegacyPlaceholderAdUrl($imageUrl)) {
                continue;
            }

            $ads[] = [
                'image_url' => $imageUrl,
                'target_url' => $targetUrl !== '' ? $targetUrl : '/browse',
                'alt_text' => $altText !== '' ? $altText : 'Advertisement',
            ];

            if (count($ads) >= $maxItems) {
                break;
            }
        }

        return array_values($ads);
    }

    private static function isLegacyPlaceholderAdUrl(string $url): bool
    {
        return preg_match('/^https:\/\/picsum\.photos\/seed\/spotthea-home-(top|before-latest|overlay)-ad-\d+\/\d+\/\d+$/i', $url) === 1;
    }

    private static function serializeValue(string $type, mixed $value): ?string
    {
        return match ($type) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            default => $value !== null ? (string) $value : null,
        };
    }
}
