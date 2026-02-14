<?php

$configuredOrigins = array_values(
    array_filter(
        array_map(
            'trim',
            explode(',', (string) env('FRONTEND_URLS', 'http://localhost:3000')),
        ),
    ),
);

$allowedOrigins = [];

foreach ($configuredOrigins as $origin) {
    $allowedOrigins[] = $origin;

    if (str_contains($origin, '://localhost')) {
        $allowedOrigins[] = str_replace('://localhost', '://127.0.0.1', $origin);
    }

    if (str_contains($origin, '://127.0.0.1')) {
        $allowedOrigins[] = str_replace('://127.0.0.1', '://localhost', $origin);
    }
}

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_unique($allowedOrigins)),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
