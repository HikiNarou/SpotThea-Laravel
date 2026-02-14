<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Manga;
use Database\Seeders\SpottheaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SpottheaSeeder::class);
    }

    public function test_home_endpoint_returns_expected_sections(): void
    {
        $response = $this->getJson('/api/home');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'featured',
                'latestUpdates',
                'tabs' => ['popular', 'latest', 'ongoing', 'completed'],
                'genres',
                'continueReading',
            ]);

        $this->assertNotEmpty($response->json('featured'));
        $this->assertNotEmpty($response->json('latestUpdates'));
        $this->assertContains($response->json('featured.0.originCountryCode'), ['JP', 'KR', 'CN']);
    }

    public function test_home_endpoint_returns_continue_reading_for_authenticated_user(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'user@spotthea.app',
            'password' => 'User12345!',
        ]);

        $login->assertOk()->assertJsonStructure(['token']);
        $token = $login->json('token');
        $this->assertIsString($token);

        $response = $this->withToken($token)->getJson('/api/home');
        $response->assertOk();

        $continueReading = $response->json('continueReading');
        $this->assertIsArray($continueReading);
        $this->assertNotEmpty($continueReading);

        $first = $continueReading[0];
        $this->assertArrayHasKey('manga', $first);
        $this->assertArrayHasKey('chapter', $first);
    }

    public function test_browse_endpoint_supports_filtering_and_pagination(): void
    {
        $response = $this->getJson('/api/browse?genres=action&sort=popular&page=1&pageSize=8');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'items',
                'page',
                'pageSize',
                'total',
                'totalPages',
            ]);

        $items = $response->json('items');
        $this->assertNotEmpty($items);

        foreach ($items as $item) {
            $this->assertContains('action', $item['genres']);
        }
    }

    public function test_browse_endpoint_supports_country_filter_and_oldest_sort(): void
    {
        $response = $this->getJson('/api/browse?genres=action&country=JP&sort=oldest&page=1&pageSize=20');

        $response->assertOk();
        $items = $response->json('items');
        $this->assertNotEmpty($items);

        foreach ($items as $item) {
            $this->assertSame('JP', $item['originCountryCode']);
            $this->assertContains('action', $item['genres']);
        }

        $timestamps = array_map(
            static fn (array $item): int => strtotime((string) $item['updatedAt']) ?: 0,
            $items,
        );
        $sorted = $timestamps;
        sort($sorted);

        $this->assertSame($sorted, $timestamps);
    }

    public function test_reader_endpoint_returns_full_reader_payload(): void
    {
        $manga = Manga::query()->where('slug', 'neon-requiem')->firstOrFail();
        $chapter = Chapter::query()
            ->where('manga_id', $manga->id)
            ->orderByDesc('number')
            ->firstOrFail();

        $response = $this->getJson(sprintf('/api/read/%s/%d', $manga->slug, $chapter->id));

        $response
            ->assertOk()
            ->assertJsonStructure([
                'manga',
                'chapter' => ['id', 'mangaId', 'pages'],
                'prevChapter',
                'nextChapter',
                'chapterOptions',
            ]);

        $this->assertGreaterThan(0, count($response->json('chapter.pages')));
    }

    public function test_manga_detail_endpoint_returns_manga_chapters_and_related(): void
    {
        $response = $this->getJson('/api/manga/aether-blade-chronicle');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'manga' => ['id', 'slug', 'title', 'firstChapter', 'latestChapter'],
                'chapters',
                'related',
            ]);

        $this->assertSame('aether-blade-chronicle', $response->json('manga.slug'));
        $this->assertSame('JP', $response->json('manga.originCountryCode'));
        $this->assertNotNull($response->json('manga.firstChapter.id'));
        $this->assertNotNull($response->json('manga.latestChapter.id'));
        $this->assertGreaterThan(0, count($response->json('chapters')));
    }

    public function test_scheduled_manga_is_hidden_from_public_until_publish_time(): void
    {
        $token = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $this->withToken($token)->postJson('/api/admin/manga', [
            'slug' => 'hidden-scheduled-manga',
            'title' => 'Hidden Scheduled Manga',
            'alt_title' => 'Hidden Schedule',
            'synopsis' => 'Manga ini dipublish terjadwal untuk mengecek visibilitas publik.',
            'status' => 'ongoing',
            'type' => 'manga',
            'content_rating' => 'safe',
            'year' => 2026,
            'author' => 'Scheduler',
            'artist' => 'Scheduler Artist',
            'serialization' => 'Schedule Weekly',
            'is_published' => true,
            'publish_at' => now()->addDay()->toISOString(),
            'cover_url' => 'https://picsum.photos/seed/hidden-scheduled-cover/480/680',
            'banner_url' => 'https://picsum.photos/seed/hidden-scheduled-banner/1600/600',
            'genres' => ['action'],
            'themes' => ['survival'],
        ])->assertCreated();

        $this->getJson('/api/manga/hidden-scheduled-manga')->assertNotFound();

        $browse = $this->getJson('/api/browse?query=hidden-scheduled-manga');
        $browse->assertOk();

        $slugs = collect($browse->json('items'))->pluck('slug')->all();
        $this->assertNotContains('hidden-scheduled-manga', $slugs);
    }

    public function test_site_settings_endpoint_returns_public_platform_configuration(): void
    {
        $response = $this->getJson('/api/site-settings');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'platform' => [
                    'maintenance_mode',
                    'site_name',
                    'site_tagline',
                    'logo_url',
                    'favicon_url',
                    'header_notice_enabled',
                    'header_notice_text',
                    'footer_description',
                    'footer_copyright',
                    'footer_links',
                    'home_ads_top_items',
                    'home_ads_before_latest_items',
                    'home_ads_overlay_enabled',
                    'home_ads_overlay_items',
                ],
            ]);

        $this->assertSame('Spotthea', $response->json('platform.site_name'));
        $this->assertFalse((bool) $response->json('platform.maintenance_mode'));
        $this->assertIsArray($response->json('platform.footer_links'));
        $this->assertNotEmpty($response->json('platform.footer_links'));
        $this->assertIsArray($response->json('platform.home_ads_top_items'));
        $this->assertCount(0, $response->json('platform.home_ads_top_items'));
        $this->assertIsArray($response->json('platform.home_ads_before_latest_items'));
        $this->assertCount(0, $response->json('platform.home_ads_before_latest_items'));
        $this->assertFalse((bool) $response->json('platform.home_ads_overlay_enabled'));
        $this->assertIsArray($response->json('platform.home_ads_overlay_items'));
        $this->assertCount(0, $response->json('platform.home_ads_overlay_items'));
    }
}
