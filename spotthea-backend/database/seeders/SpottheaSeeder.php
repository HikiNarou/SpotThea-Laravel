<?php

namespace Database\Seeders;

use App\Models\Chapter;
use App\Models\CommentLike;
use App\Models\Genre;
use App\Models\LibraryEntry;
use App\Models\Manga;
use App\Models\MangaComment;
use App\Models\MangaRating;
use App\Models\NotificationPreference;
use App\Models\ReadingHistory;
use App\Models\SiteSetting;
use App\Models\Theme;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SpottheaSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $admin = User::query()->updateOrCreate(
                ['email' => 'admin@spotthea.app'],
                [
                    'name' => 'Spotthea Admin',
                    'username' => 'SpottheaAdmin',
                    'password' => 'Admin12345!',
                    'role' => 'admin',
                    'preferred_locale' => 'id',
                    'avatar_url' => 'https://picsum.photos/seed/admin/120/120',
                    'bio' => 'Platform administrator.',
                ],
            );

            $moderator = User::query()->updateOrCreate(
                ['email' => 'moderator@spotthea.app'],
                [
                    'name' => 'Spotthea Moderator',
                    'username' => 'SpottheaMod',
                    'password' => 'Mod12345!',
                    'role' => 'moderator',
                    'preferred_locale' => 'id',
                    'avatar_url' => 'https://picsum.photos/seed/moderator/120/120',
                    'bio' => 'Community moderator.',
                ],
            );

            $member = User::query()->updateOrCreate(
                ['email' => 'user@spotthea.app'],
                [
                    'name' => 'Aster Reader',
                    'username' => 'AsterReader',
                    'password' => 'User12345!',
                    'role' => 'user',
                    'preferred_locale' => 'id',
                    'avatar_url' => 'https://picsum.photos/seed/user-1/120/120',
                    'bio' => 'Daily manga reader.',
                ],
            );

            foreach ([$admin, $moderator, $member] as $user) {
                NotificationPreference::query()->updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'email' => true,
                        'push' => false,
                        'quiet_hours_start' => '22:00',
                        'quiet_hours_end' => '07:00',
                    ],
                );
            }

            $genreNames = [
                'action', 'adventure', 'fantasy', 'sci-fi', 'mystery',
                'thriller', 'drama', 'romance', 'comedy', 'historical',
                'military', 'slice-of-life', 'school', 'supernatural',
            ];

            $genres = collect($genreNames)->mapWithKeys(function (string $slug): array {
                $genre = Genre::query()->updateOrCreate(
                    ['slug' => $slug],
                    ['name' => ucwords(str_replace('-', ' ', $slug))],
                );

                return [$slug => $genre];
            });

            $themeNames = [
                'revenge',
                'academy',
                'war',
                'urban-fantasy',
                'healing',
                'survival',
                'found-family',
            ];

            $themes = collect($themeNames)->mapWithKeys(function (string $slug): array {
                $theme = Theme::query()->updateOrCreate(
                    ['slug' => $slug],
                    ['name' => ucwords(str_replace('-', ' ', $slug))],
                );

                return [$slug => $theme];
            });

            $mangaSeeds = [
                [
                    'slug' => 'aether-blade-chronicle',
                    'title' => 'Aether Blade Chronicle',
                    'alt_title' => 'Kisah Pedang Aether',
                    'synopsis' => 'A courier discovers a relic blade that stores memory imprints from legendary swordsmen.',
                    'status' => 'ongoing',
                    'type' => 'manga',
                    'content_rating' => 'safe',
                    'year' => 2023,
                    'author' => 'Rin Kagami',
                    'artist' => 'Milo Hartono',
                    'serialization' => 'Skyline Weekly',
                    'original_language' => 'ja',
                    'chapter_count' => 20,
                    'base_rating' => 4.60,
                    'base_rating_count' => 12520,
                    'views' => 2834000,
                    'followers' => 183200,
                    'featured_rank' => 1,
                    'popular_rank' => 2,
                    'genres' => ['action', 'fantasy', 'adventure'],
                    'themes' => ['revenge', 'survival'],
                    'content_warnings' => ['violence'],
                    'formats' => ['long-strip'],
                ],
                [
                    'slug' => 'neon-requiem',
                    'title' => 'Neon Requiem',
                    'alt_title' => 'Ratapan Neon',
                    'synopsis' => 'A cybernetic detective and a street hacker investigate illegal experiments in Neo-Jakarta.',
                    'status' => 'ongoing',
                    'type' => 'manhwa',
                    'content_rating' => 'mature',
                    'year' => 2022,
                    'author' => 'Aya Voss',
                    'artist' => 'Keitaro Han',
                    'serialization' => 'Cityline Comics',
                    'original_language' => 'ko',
                    'chapter_count' => 22,
                    'base_rating' => 4.70,
                    'base_rating_count' => 19310,
                    'views' => 4211000,
                    'followers' => 265000,
                    'featured_rank' => 2,
                    'popular_rank' => 1,
                    'genres' => ['action', 'sci-fi', 'mystery', 'thriller'],
                    'themes' => ['urban-fantasy', 'survival'],
                    'content_warnings' => ['gore', 'sexual-violence'],
                    'formats' => ['full-color', 'long-strip'],
                ],
                [
                    'slug' => 'thorn-pact-academy',
                    'title' => 'Thorn Pact Academy',
                    'alt_title' => 'Akademi Pakta Duri',
                    'synopsis' => 'A contract mage academy hides forbidden rituals under its prestigious facade.',
                    'status' => 'ongoing',
                    'type' => 'manhwa',
                    'content_rating' => 'safe',
                    'year' => 2024,
                    'author' => 'Celeste Nara',
                    'artist' => 'Kaiyya',
                    'serialization' => 'Arcane Young',
                    'original_language' => 'ko',
                    'chapter_count' => 18,
                    'base_rating' => 4.50,
                    'base_rating_count' => 9740,
                    'views' => 1659000,
                    'followers' => 120440,
                    'featured_rank' => null,
                    'popular_rank' => 8,
                    'genres' => ['fantasy', 'school', 'drama', 'action'],
                    'themes' => ['academy', 'found-family'],
                    'content_warnings' => ['violence'],
                    'formats' => ['long-strip'],
                ],
                [
                    'slug' => 'iron-lotus-regiment',
                    'title' => 'Iron Lotus Regiment',
                    'alt_title' => 'Resimen Teratai Besi',
                    'synopsis' => 'A frontline medical unit doubles as a covert squad during a continental war.',
                    'status' => 'completed',
                    'type' => 'manga',
                    'content_rating' => 'safe',
                    'year' => 2020,
                    'author' => 'Hiroto Gin',
                    'artist' => 'Lia Marcell',
                    'serialization' => 'Frontline Prime',
                    'original_language' => 'ja',
                    'chapter_count' => 24,
                    'base_rating' => 4.80,
                    'base_rating_count' => 27040,
                    'views' => 5081000,
                    'followers' => 312000,
                    'featured_rank' => 3,
                    'popular_rank' => 3,
                    'genres' => ['action', 'drama', 'military', 'historical'],
                    'themes' => ['war'],
                    'content_warnings' => ['violence'],
                    'formats' => ['tankobon'],
                ],
                [
                    'slug' => 'hanami-at-midnight',
                    'title' => 'Hanami at Midnight',
                    'alt_title' => 'Hanami Tengah Malam',
                    'synopsis' => 'A literature student signs a spirit contract and must rewrite unfinished ghost romances.',
                    'status' => 'ongoing',
                    'type' => 'manga',
                    'content_rating' => 'safe',
                    'year' => 2021,
                    'author' => 'Sora Minami',
                    'artist' => 'Dina Yudhistira',
                    'serialization' => 'Moonpetal',
                    'original_language' => 'ja',
                    'chapter_count' => 16,
                    'base_rating' => 4.40,
                    'base_rating_count' => 9120,
                    'views' => 1588000,
                    'followers' => 109400,
                    'featured_rank' => 4,
                    'popular_rank' => 7,
                    'genres' => ['romance', 'drama', 'supernatural'],
                    'themes' => ['healing', 'found-family'],
                    'content_warnings' => [],
                    'formats' => ['tankobon'],
                ],
                [
                    'slug' => 'golem-and-barista',
                    'title' => 'Golem & Barista',
                    'alt_title' => 'Golem dan Barista',
                    'synopsis' => 'A shy barista inherits a cafe that serves customers from different dimensions.',
                    'status' => 'ongoing',
                    'type' => 'manhua',
                    'content_rating' => 'safe',
                    'year' => 2024,
                    'author' => 'Nadia Kuro',
                    'artist' => 'Pao Irawan',
                    'serialization' => 'Steam & Sugar',
                    'original_language' => 'zh',
                    'chapter_count' => 14,
                    'base_rating' => 4.30,
                    'base_rating_count' => 6044,
                    'views' => 940000,
                    'followers' => 78210,
                    'featured_rank' => 5,
                    'popular_rank' => 9,
                    'genres' => ['slice-of-life', 'fantasy', 'comedy'],
                    'themes' => ['healing'],
                    'content_warnings' => [],
                    'formats' => ['full-color'],
                ],
            ];

            $mangaMap = collect();

            foreach ($mangaSeeds as $seed) {
                $manga = Manga::query()->updateOrCreate(
                    ['slug' => $seed['slug']],
                    [
                        'title' => $seed['title'],
                        'alt_title' => $seed['alt_title'],
                        'synopsis' => $seed['synopsis'],
                        'status' => $seed['status'],
                        'type' => $seed['type'],
                        'content_rating' => $seed['content_rating'],
                        'year' => $seed['year'],
                        'author' => $seed['author'],
                        'artist' => $seed['artist'],
                        'serialization' => $seed['serialization'],
                        'original_language' => $seed['original_language'] ?? null,
                        'content_warnings' => $seed['content_warnings'] ?? [],
                        'formats' => $seed['formats'] ?? [],
                        'is_published' => true,
                        'publish_at' => now()->subHours(3),
                        'cover_url' => sprintf('https://picsum.photos/seed/%s-cover/480/680', urlencode($seed['slug'])),
                        'banner_url' => sprintf('https://picsum.photos/seed/%s-banner/1600/600', urlencode($seed['slug'])),
                        'chapter_count' => $seed['chapter_count'],
                        'base_rating' => $seed['base_rating'],
                        'base_rating_count' => $seed['base_rating_count'],
                        'views' => $seed['views'],
                        'followers' => $seed['followers'],
                        'featured_rank' => $seed['featured_rank'],
                        'popular_rank' => $seed['popular_rank'],
                        'updated_content_at' => now()->subDays($seed['popular_rank']),
                    ],
                );

                $manga->genres()->sync(
                    collect($seed['genres'])
                        ->map(fn (string $slug): int => $genres[$slug]->id)
                        ->all(),
                );

                $manga->themes()->sync(
                    collect($seed['themes'] ?? [])
                        ->map(fn (string $slug): int => $themes[$slug]->id)
                        ->all(),
                );

                $mangaMap->put($seed['slug'], $manga);

                if ($manga->chapters()->count() < (int) $seed['chapter_count']) {
                    $manga->chapters()->delete();

                    for ($chapterNumber = 1; $chapterNumber <= (int) $seed['chapter_count']; $chapterNumber++) {
                        $chapter = $manga->chapters()->create([
                            'number' => $chapterNumber,
                            'title' => sprintf('Chapter %d - %s', $chapterNumber, $chapterNumber % 2 === 0 ? 'Crossroads' : 'New Ember'),
                            'published_at' => now()->subDays(($seed['chapter_count'] - $chapterNumber) + $seed['popular_rank']),
                            'is_published' => true,
                            'pages_count' => 12,
                        ]);

                        $pages = [];

                        for ($index = 0; $index < 12; $index++) {
                            $pages[] = [
                                'chapter_id' => $chapter->id,
                                'page_index' => $index,
                                'image_url' => sprintf(
                                    'https://picsum.photos/seed/%s-c%s-p%s/1200/1750',
                                    urlencode($seed['slug']),
                                    $chapterNumber,
                                    $index + 1,
                                ),
                                'width' => 1200,
                                'height' => 1750,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }

                        $chapter->pages()->insert($pages);
                    }
                }
            }

            $followManga = [
                'neon-requiem',
                'aether-blade-chronicle',
                'thorn-pact-academy',
            ];

            foreach ($followManga as $slug) {
                $manga = $mangaMap->get($slug);
                if (! $manga instanceof Manga) {
                    continue;
                }

                LibraryEntry::query()->updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'manga_id' => $manga->id,
                        'type' => 'following',
                    ],
                    [],
                );
            }

            LibraryEntry::query()->updateOrCreate(
                [
                    'user_id' => $member->id,
                    'manga_id' => $mangaMap['aether-blade-chronicle']->id,
                    'type' => 'bookmark',
                ],
                [],
            );

            $historyTargets = [
                ['slug' => 'neon-requiem', 'chapter' => 12, 'page' => 6, 'progress' => 42],
                ['slug' => 'aether-blade-chronicle', 'chapter' => 10, 'page' => 11, 'progress' => 88],
                ['slug' => 'thorn-pact-academy', 'chapter' => 8, 'page' => 2, 'progress' => 22],
            ];

            foreach ($historyTargets as $history) {
                $manga = $mangaMap[$history['slug']];
                $chapter = Chapter::query()
                    ->where('manga_id', $manga->id)
                    ->where('number', $history['chapter'])
                    ->first();

                if (! $chapter instanceof Chapter) {
                    continue;
                }

                ReadingHistory::query()->updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'chapter_id' => $chapter->id,
                    ],
                    [
                        'manga_id' => $manga->id,
                        'page_index' => $history['page'],
                        'progress_pct' => $history['progress'],
                        'updated_at' => now()->subDays(random_int(0, 3)),
                    ],
                );
            }

            $ratingTargets = [
                'neon-requiem' => 5,
                'aether-blade-chronicle' => 4,
                'thorn-pact-academy' => 4,
            ];

            foreach ($ratingTargets as $slug => $value) {
                MangaRating::query()->updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'manga_id' => $mangaMap[$slug]->id,
                    ],
                    ['value' => $value],
                );
            }

            $commentOne = MangaComment::query()->updateOrCreate(
                [
                    'manga_id' => $mangaMap['neon-requiem']->id,
                    'user_id' => $member->id,
                    'content' => 'Art dan pacing chapter terakhir rapi banget, plot twist-nya kena.',
                ],
                ['likes' => 1],
            );

            $commentTwo = MangaComment::query()->updateOrCreate(
                [
                    'manga_id' => $mangaMap['aether-blade-chronicle']->id,
                    'user_id' => $moderator->id,
                    'content' => 'World-building konsisten, kualitas panel stabil sejak chapter 8.',
                ],
                ['likes' => 2],
            );

            CommentLike::query()->updateOrCreate(
                [
                    'comment_id' => $commentOne->id,
                    'user_id' => $moderator->id,
                ],
                [],
            );

            CommentLike::query()->updateOrCreate(
                [
                    'comment_id' => $commentTwo->id,
                    'user_id' => $member->id,
                ],
                [],
            );

            $latestNeon = Chapter::query()
                ->where('manga_id', $mangaMap['neon-requiem']->id)
                ->orderByDesc('number')
                ->first();

            if ($latestNeon instanceof Chapter) {
                UserNotification::query()->updateOrCreate(
                    [
                        'user_id' => $member->id,
                        'manga_id' => $latestNeon->manga_id,
                        'chapter_id' => $latestNeon->id,
                    ],
                    [
                        'title' => 'Update Neon Requiem',
                        'body' => sprintf('Chapter %.2f baru sudah tersedia.', (float) $latestNeon->number),
                        'is_read' => false,
                    ],
                );
            }

            $defaultPlatformSettings = [
                'maintenance_mode' => ['type' => 'boolean', 'value' => 'false'],
                'site_name' => ['type' => 'string', 'value' => 'Spotthea'],
                'site_tagline' => ['type' => 'string', 'value' => 'Manga Reader'],
                'logo_url' => ['type' => 'string', 'value' => null],
                'favicon_url' => ['type' => 'string', 'value' => null],
                'header_notice_enabled' => ['type' => 'boolean', 'value' => 'false'],
                'header_notice_text' => ['type' => 'string', 'value' => ''],
                'footer_description' => ['type' => 'string', 'value' => 'Platform membaca manga dengan pengalaman reader fokus mobile dan desktop.'],
                'footer_copyright' => ['type' => 'string', 'value' => '© Spotthea'],
                'footer_links' => ['type' => 'json', 'value' => json_encode([
                    ['label' => 'About', 'href' => '/about'],
                    ['label' => 'DMCA', 'href' => '/dmca'],
                    ['label' => 'Privacy', 'href' => '/privacy'],
                    ['label' => 'Terms', 'href' => '/terms'],
                    ['label' => 'Contact', 'href' => '/contact'],
                    ['label' => 'Report', 'href' => '/report'],
                ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
                'home_ads_top_items' => ['type' => 'json', 'value' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
                'home_ads_before_latest_items' => ['type' => 'json', 'value' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
                'home_ads_overlay_enabled' => ['type' => 'boolean', 'value' => 'false'],
                'home_ads_overlay_items' => ['type' => 'json', 'value' => json_encode([], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)],
                'home_banner' => ['type' => 'json', 'value' => json_encode([
                    'title' => 'Weekly Spotlight',
                    'subtitle' => 'New chapter drops every day',
                ], JSON_UNESCAPED_UNICODE)],
            ];

            foreach ($defaultPlatformSettings as $key => $config) {
                SiteSetting::query()->updateOrCreate(
                    ['key' => $key],
                    $config,
                );
            }

            foreach ($mangaMap as $manga) {
                $manga->update([
                    'chapter_count' => $manga->chapters()->count(),
                    'followers' => LibraryEntry::query()
                        ->where('manga_id', $manga->id)
                        ->where('type', 'following')
                        ->count(),
                    'updated_content_at' => $manga->chapters()->max('published_at') ?? now(),
                ]);
            }
        });
    }
}
