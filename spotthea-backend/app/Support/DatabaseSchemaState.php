<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;
use Throwable;

final class DatabaseSchemaState
{
    private static ?bool $hasThemeTables = null;

    private static ?bool $hasMangaPublishColumns = null;

    private static ?bool $hasMangaTagColumns = null;

    public static function hasThemeTables(): bool
    {
        if (self::$hasThemeTables !== null) {
            return self::$hasThemeTables;
        }

        self::$hasThemeTables = self::safeHasTable('themes') && self::safeHasTable('manga_theme');

        return self::$hasThemeTables;
    }

    public static function hasMangaPublishColumns(): bool
    {
        if (self::$hasMangaPublishColumns !== null) {
            return self::$hasMangaPublishColumns;
        }

        self::$hasMangaPublishColumns = self::safeHasTable('mangas')
            && self::safeHasColumn('mangas', 'is_published')
            && self::safeHasColumn('mangas', 'publish_at');

        return self::$hasMangaPublishColumns;
    }

    public static function hasMangaTagColumns(): bool
    {
        if (self::$hasMangaTagColumns !== null) {
            return self::$hasMangaTagColumns;
        }

        self::$hasMangaTagColumns = self::safeHasTable('mangas')
            && self::safeHasColumn('mangas', 'original_language')
            && self::safeHasColumn('mangas', 'content_warnings')
            && self::safeHasColumn('mangas', 'formats');

        return self::$hasMangaTagColumns;
    }

    private static function safeHasTable(string $table): bool
    {
        try {
            return Schema::hasTable($table);
        } catch (Throwable) {
            return false;
        }
    }

    private static function safeHasColumn(string $table, string $column): bool
    {
        try {
            return Schema::hasColumn($table, $column);
        } catch (Throwable) {
            return false;
        }
    }
}
