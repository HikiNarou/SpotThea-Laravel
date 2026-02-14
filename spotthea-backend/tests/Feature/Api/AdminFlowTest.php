<?php

namespace Tests\Feature\Api;

use App\Models\BroadcastAnnouncement;
use App\Models\Chapter;
use App\Models\Manga;
use App\Models\SiteSetting;
use App\Models\User;
use Database\Seeders\SpottheaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use ZipArchive;

class AdminFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SpottheaSeeder::class);
    }

    public function test_admin_can_manage_manga_and_chapters(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $createManga = $this->withToken($token)->postJson('/api/admin/manga', [
            'slug' => 'api-admin-created-manga',
            'title' => 'API Admin Created Manga',
            'alt_title' => 'Admin Manga',
            'synopsis' => 'Created from automated feature test for admin flow.',
            'status' => 'ongoing',
            'type' => 'manga',
            'content_rating' => 'safe',
            'year' => 2026,
            'author' => 'Admin Author',
            'artist' => 'Admin Artist',
            'serialization' => 'QA Weekly',
            'cover_url' => 'https://picsum.photos/seed/admin-manga/480/680',
            'banner_url' => 'https://picsum.photos/seed/admin-manga-banner/1600/600',
            'genres' => ['action', 'fantasy'],
        ]);

        $createManga->assertCreated()->assertJsonPath('slug', 'api-admin-created-manga');
        $mangaId = (int) $createManga->json('id');

        $chapterResponse = $this->withToken($token)->postJson(sprintf('/api/admin/manga/%d/chapters', $mangaId), [
            'number' => 1,
            'title' => 'Pilot',
            'is_oneshot' => false,
            'volume_number' => 1,
            'translation_language' => 'id',
            'is_published' => true,
            'pages' => [
                ['image_url' => 'https://picsum.photos/seed/page-1/1200/1750', 'width' => 1200, 'height' => 1750],
                ['image_url' => 'https://picsum.photos/seed/page-2/1200/1750', 'width' => 1200, 'height' => 1750],
            ],
        ]);

        $chapterResponse
            ->assertCreated()
            ->assertJsonPath('mangaId', (string) $mangaId)
            ->assertJsonPath('isOneshot', false)
            ->assertJsonPath('volumeNumber', 1)
            ->assertJsonPath('translationLanguage', 'id');
        $chapterId = (int) $chapterResponse->json('id');

        $this->assertDatabaseHas('chapters', [
            'id' => $chapterId,
            'is_oneshot' => false,
            'volume_number' => '1.00',
            'translation_language' => 'id',
        ]);

        $pages = $this->withToken($token)->getJson(sprintf('/api/admin/chapters/%d/pages', $chapterId))
            ->assertOk()
            ->json();

        $this->assertCount(2, $pages);

        $this->withToken($token)->patchJson(sprintf('/api/admin/chapters/%d/pages/reorder', $chapterId), [
            'page_ids' => [(int) $pages[1]['id'], (int) $pages[0]['id']],
        ])->assertOk();

        $this->withToken($token)->putJson('/api/admin/settings', [
            'settings' => [
                ['key' => 'maintenance_mode', 'type' => 'boolean', 'value' => false],
            ],
        ])->assertOk()->assertJsonStructure(['settings']);
    }

    public function test_non_admin_cannot_access_admin_write_routes(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'user@spotthea.app',
            'password' => 'User12345!',
        ])->assertOk()->json('token');

        $manga = Manga::query()->firstOrFail();
        $chapter = Chapter::query()->where('manga_id', $manga->id)->firstOrFail();

        $this->withToken($token)->patchJson(sprintf('/api/admin/chapters/%d', $chapter->id), [
            'title' => 'Unauthorized update attempt',
        ])->assertForbidden();

        $this->withToken($token)->putJson('/api/admin/settings', [
            'settings' => [
                ['key' => 'maintenance_mode', 'type' => 'boolean', 'value' => true],
            ],
        ])->assertForbidden();

        $this->withToken($token)->putJson('/api/admin/settings/platform', [
            'maintenance_mode' => true,
            'site_name' => 'SpotThea',
            'site_tagline' => 'Reader',
            'logo_url' => null,
            'favicon_url' => null,
            'header_notice_enabled' => false,
            'header_notice_text' => '',
            'footer_description' => 'Desc',
            'footer_copyright' => '© SpotThea',
            'footer_links' => [
                ['label' => 'About', 'href' => '/about'],
            ],
            'home_ads_top_items' => [],
            'home_ads_before_latest_items' => [],
            'home_ads_overlay_enabled' => false,
            'home_ads_overlay_items' => [],
        ])->assertForbidden();
    }

    public function test_admin_store_generates_slug_from_title_when_slug_missing(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $response = $this->withToken($token)->postJson('/api/admin/manga', [
            'title' => 'Ini tuh judul slug otomatis nya',
            'alt_title' => 'Judul Auto Slug',
            'synopsis' => 'Manga untuk memastikan slug otomatis dibuat dari judul saat slug kosong di request.',
            'status' => 'ongoing',
            'type' => 'manga',
            'content_rating' => 'safe',
            'year' => 2026,
            'author' => 'Admin Author',
            'artist' => 'Admin Artist',
            'serialization' => 'QA Weekly',
            'cover_url' => 'https://picsum.photos/seed/auto-slug-manga/480/680',
            'banner_url' => 'https://picsum.photos/seed/auto-slug-banner/1600/600',
            'genres' => ['action'],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('slug', 'ini-tuh-judul-slug-otomatis-nya');
    }

    public function test_admin_can_manage_themes_and_upload_manga_assets(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $themeResponse = $this->withToken($token)->postJson('/api/admin/themes', [
            'name' => 'Political Drama',
        ]);

        $themeResponse
            ->assertCreated()
            ->assertJsonPath('slug', 'political-drama');

        Storage::fake('public');

        $upload = $this->withToken($token)->post(
            '/api/admin/uploads/manga-assets',
            [
                'type' => 'cover',
                'file' => UploadedFile::fake()->image('cover-upload.jpg', 720, 1080),
            ],
            ['Accept' => 'application/json'],
        );

        $upload
            ->assertOk()
            ->assertJsonPath('type', 'cover')
            ->assertJsonPath('width', 720)
            ->assertJsonPath('height', 1080);
    }

    public function test_admin_can_upload_chapter_pages_from_images_and_zip(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        /** @var Chapter $chapter */
        $chapter = Chapter::query()->with('manga')->firstOrFail();
        Storage::fake('public');

        $imageUpload = $this->withToken($token)->post(
            sprintf('/api/admin/chapters/%d/pages/upload', $chapter->id),
            [
                'files' => [
                    UploadedFile::fake()->image('10-page.jpg', 640, 960),
                    UploadedFile::fake()->image('02-page.jpg', 640, 960),
                ],
            ],
            ['Accept' => 'application/json'],
        );

        $imageUpload
            ->assertOk()
            ->assertJsonCount(2, 'items')
            ->assertJsonPath('items.0.sourceName', '02-page.jpg')
            ->assertJsonPath('items.1.sourceName', '10-page.jpg');

        $uploadedImageItems = $imageUpload->json('items');
        $this->assertStringEndsWith('/02-page.jpg', (string) ($uploadedImageItems[0]['imageUrl'] ?? ''));
        $this->assertStringEndsWith('/10-page.jpg', (string) ($uploadedImageItems[1]['imageUrl'] ?? ''));

        $directory = sprintf('chapter-pages/manga-%d/chapter-%d', $chapter->manga_id, $chapter->id);
        $storedFiles = Storage::disk('public')->allFiles($directory);
        $this->assertCount(2, $storedFiles);
        $this->assertContains(sprintf('%s/02-page.jpg', $directory), $storedFiles);
        $this->assertContains(sprintf('%s/10-page.jpg', $directory), $storedFiles);

        if (!class_exists(ZipArchive::class)) {
            $this->markTestSkipped('PHP zip extension is not installed.');
        }

        $archivePath = sprintf('%s%sadmin-upload-pages-%s.zip', sys_get_temp_dir(), DIRECTORY_SEPARATOR, uniqid('', true));
        $zip = new ZipArchive();
        $zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addFromString('11-page.jpg', str_repeat('a', 2048));
        $zip->addFromString('01-page.jpg', str_repeat('b', 2048));
        $zip->close();

        try {
            $zipUpload = $this->withToken($token)->post(
                sprintf('/api/admin/chapters/%d/pages/upload-zip', $chapter->id),
                [
                    'archive' => new UploadedFile($archivePath, 'pages.zip', 'application/zip', null, true),
                ],
                ['Accept' => 'application/json'],
            );

            $zipUpload
                ->assertOk()
                ->assertJsonCount(2, 'items')
                ->assertJsonPath('items.0.sourceName', '01-page.jpg');

            $uploadedZipItems = $zipUpload->json('items');
            $this->assertStringEndsWith('/01-page.jpg', (string) ($uploadedZipItems[0]['imageUrl'] ?? ''));
            $this->assertStringEndsWith('/11-page.jpg', (string) ($uploadedZipItems[1]['imageUrl'] ?? ''));
        } finally {
            if (file_exists($archivePath)) {
                unlink($archivePath);
            }
        }
    }

    public function test_admin_can_filter_sort_and_paginate_chapter_management_list(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $manga = Manga::query()->where('slug', 'neon-requiem')->firstOrFail();

        $pageOneDesc = $this->withToken($token)->getJson(
            sprintf('/api/admin/manga/%d/chapters?page=1&pageSize=10&sort_by=number&sort_dir=desc', $manga->id),
        );

        $pageOneDesc
            ->assertOk()
            ->assertJsonPath('page', 1)
            ->assertJsonPath('pageSize', 10);

        $itemsDesc = $pageOneDesc->json('items');
        $this->assertCount(10, $itemsDesc);
        $this->assertGreaterThan((float) $itemsDesc[1]['number'], (float) $itemsDesc[0]['number']);

        $pageOneAsc = $this->withToken($token)->getJson(
            sprintf('/api/admin/manga/%d/chapters?page=1&pageSize=10&sort_by=number&sort_dir=asc', $manga->id),
        );

        $pageOneAsc->assertOk();
        $itemsAsc = $pageOneAsc->json('items');
        $this->assertCount(10, $itemsAsc);
        $this->assertLessThan((float) $itemsAsc[1]['number'], (float) $itemsAsc[0]['number']);

        $searchCrossroads = $this->withToken($token)->getJson(
            sprintf('/api/admin/manga/%d/chapters?q=Crossroads&page=1&pageSize=10&sort_by=number&sort_dir=desc', $manga->id),
        );

        $searchCrossroads->assertOk();
        $titles = collect($searchCrossroads->json('items'))->pluck('title')->all();
        $this->assertNotEmpty($titles);
        foreach ($titles as $title) {
            $this->assertStringContainsStringIgnoringCase('crossroads', (string) $title);
        }
    }

    public function test_admin_broadcast_reaches_users_and_public_announcements_feed(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $usersCount = User::query()->count();

        $broadcast = $this->withToken($token)->postJson('/api/admin/broadcast', [
            'title' => 'Maintenance Notice',
            'body' => 'Server maintenance dijadwalkan pukul 02:00 WIB.',
        ]);

        $broadcast
            ->assertOk()
            ->assertJsonPath('sent', $usersCount)
            ->assertJsonPath('announcement.title', 'Maintenance Notice');

        $announcementId = (int) $broadcast->json('announcement.id');

        $this->assertDatabaseHas('broadcast_announcements', [
            'id' => $announcementId,
            'title' => 'Maintenance Notice',
        ]);

        $this->assertDatabaseCount('user_notifications', $usersCount + 1);

        $this->getJson('/api/announcements')
            ->assertOk()
            ->assertJsonPath('items.0.id', (string) $announcementId)
            ->assertJsonPath('items.0.title', 'Maintenance Notice');

        $memberToken = $this->postJson('/api/auth/login', [
            'email' => 'user@spotthea.app',
            'password' => 'User12345!',
        ])->assertOk()->json('token');

        $this->withToken($memberToken)->getJson('/api/me/notifications')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Maintenance Notice',
            ]);
    }

    public function test_admin_can_update_platform_settings_and_public_endpoint_reflects_changes(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $payload = [
            'maintenance_mode' => true,
            'site_name' => 'SpotThea Prime',
            'site_tagline' => 'Reader Experience Engine',
            'logo_url' => 'https://cdn.example.com/logo.png',
            'favicon_url' => 'https://cdn.example.com/favicon.ico',
            'header_notice_enabled' => true,
            'header_notice_text' => 'Scheduled release window starts at 20:00 WIB.',
            'footer_description' => 'Platform baca manga yang dikelola penuh oleh tim admin.',
            'footer_copyright' => '© 2026 SpotThea Prime',
            'footer_links' => [
                ['label' => 'About', 'href' => '/about'],
                ['label' => 'Status', 'href' => 'https://status.spotthea.app'],
            ],
            'home_ads_top_items' => collect(range(1, 8))->map(static fn (int $index): array => [
                'image_url' => "https://cdn.example.com/ads/top-{$index}.jpg",
                'target_url' => $index % 2 === 0 ? '/browse' : "https://sponsor-top.example/{$index}",
                'alt_text' => "Top Banner {$index}",
            ])->all(),
            'home_ads_before_latest_items' => collect(range(1, 4))->map(static fn (int $index): array => [
                'image_url' => "https://cdn.example.com/ads/latest-{$index}.jpg",
                'target_url' => $index % 2 === 0 ? '/updates' : "https://sponsor-latest.example/{$index}",
                'alt_text' => "Latest Banner {$index}",
            ])->all(),
            'home_ads_overlay_enabled' => true,
            'home_ads_overlay_items' => collect(range(1, 2))->map(static fn (int $index): array => [
                'image_url' => "https://cdn.example.com/ads/overlay-{$index}.jpg",
                'target_url' => "https://sponsor-overlay.example/{$index}",
                'alt_text' => "Overlay Banner {$index}",
            ])->all(),
        ];

        $this->withToken($token)->putJson('/api/admin/settings/platform', $payload)
            ->assertOk()
            ->assertJsonPath('platform.site_name', 'SpotThea Prime')
            ->assertJsonPath('platform.maintenance_mode', true)
            ->assertJsonPath('platform.footer_links.1.href', 'https://status.spotthea.app')
            ->assertJsonPath('platform.home_ads_top_items.0.image_url', 'https://cdn.example.com/ads/top-1.jpg')
            ->assertJsonPath('platform.home_ads_before_latest_items.1.target_url', '/updates')
            ->assertJsonPath('platform.home_ads_overlay_enabled', true)
            ->assertJsonPath('platform.home_ads_overlay_items.0.alt_text', 'Overlay Banner 1');

        $this->assertDatabaseHas('site_settings', [
            'key' => 'site_name',
            'type' => 'string',
            'value' => 'SpotThea Prime',
        ]);

        $this->assertDatabaseHas('site_settings', [
            'key' => 'header_notice_enabled',
            'type' => 'boolean',
            'value' => 'true',
        ]);

        $storedFooterLinks = SiteSetting::query()
            ->where('key', 'footer_links')
            ->value('value');

        $this->assertIsString($storedFooterLinks);
        $this->assertStringContainsString('status.spotthea.app', $storedFooterLinks);

        $storedTopAds = SiteSetting::query()
            ->where('key', 'home_ads_top_items')
            ->value('value');

        $this->assertIsString($storedTopAds);
        $this->assertStringContainsString('top-1.jpg', $storedTopAds);

        $this->getJson('/api/site-settings')
            ->assertOk()
            ->assertJsonPath('platform.site_name', 'SpotThea Prime')
            ->assertJsonPath('platform.maintenance_mode', true)
            ->assertJsonPath('platform.footer_links.1.label', 'Status')
            ->assertJsonPath('platform.home_ads_top_items.0.alt_text', 'Top Banner 1')
            ->assertJsonPath('platform.home_ads_before_latest_items.0.image_url', 'https://cdn.example.com/ads/latest-1.jpg')
            ->assertJsonPath('platform.home_ads_overlay_enabled', true);
    }

    public function test_promoted_user_gains_admin_access_with_existing_token(): void
    {
        $memberLogin = $this->postJson('/api/auth/login', [
            'email' => 'user@spotthea.app',
            'password' => 'User12345!',
        ])->assertOk();

        $memberToken = $memberLogin->json('token');
        $memberUserId = (int) $memberLogin->json('user.id');

        $adminToken = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $this->withToken($adminToken)->patchJson(sprintf('/api/admin/users/%d/role', $memberUserId), [
            'role' => 'admin',
        ])->assertOk()->assertJsonPath('role', 'admin');

        $this->withToken($memberToken)->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonStructure(['kpi']);
    }

    public function test_demoted_admin_loses_admin_access_with_existing_token(): void
    {
        $adminLogin = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk();

        $adminToken = $adminLogin->json('token');
        $adminUserId = (int) $adminLogin->json('user.id');

        $this->withToken($adminToken)->patchJson(sprintf('/api/admin/users/%d/role', $adminUserId), [
            'role' => 'user',
        ])->assertOk()->assertJsonPath('role', 'user');

        $this->withToken($adminToken)->getJson('/api/admin/dashboard')
            ->assertForbidden();
    }

    public function test_admin_can_save_platform_settings_with_empty_ads_slots(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $payload = [
            'maintenance_mode' => false,
            'site_name' => 'SpotThea',
            'site_tagline' => 'Manga Reader',
            'logo_url' => null,
            'favicon_url' => null,
            'header_notice_enabled' => false,
            'header_notice_text' => '',
            'footer_description' => 'Platform membaca manga dengan pengalaman reader fokus mobile dan desktop.',
            'footer_copyright' => '© Spotthea',
            'footer_links' => [
                ['label' => 'About', 'href' => '/about'],
            ],
            'home_ads_top_items' => [],
            'home_ads_before_latest_items' => [],
            'home_ads_overlay_enabled' => false,
            'home_ads_overlay_items' => [],
        ];

        $this->withToken($token)->putJson('/api/admin/settings/platform', $payload)
            ->assertOk()
            ->assertJsonPath('platform.home_ads_top_items', [])
            ->assertJsonPath('platform.home_ads_before_latest_items', [])
            ->assertJsonPath('platform.home_ads_overlay_enabled', false)
            ->assertJsonPath('platform.home_ads_overlay_items', []);
    }
}
