<?php

namespace Tests\Feature\Api;

use App\Models\Chapter;
use App\Models\Manga;
use App\Models\ReadingHistory;
use App\Models\User;
use Database\Seeders\SpottheaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthAndUserFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(SpottheaSeeder::class);
    }

    public function test_registration_assigns_default_user_role_even_if_role_is_provided(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'username' => 'RoleInjectionUser',
            'email' => 'role-injection@example.com',
            'password' => 'RoleInject123!',
            'role' => 'admin',
        ]);

        $register
            ->assertCreated()
            ->assertJsonPath('user.email', 'role-injection@example.com')
            ->assertJsonPath('user.role', 'user');

        $this->assertDatabaseHas('users', [
            'email' => 'role-injection@example.com',
            'role' => 'user',
        ]);
    }

    public function test_admin_users_listing_contains_newly_registered_user_with_user_role(): void
    {
        $register = $this->postJson('/api/auth/register', [
            'username' => 'FreshMember',
            'email' => 'fresh-member@example.com',
            'password' => 'FreshMember123!',
        ]);

        $register->assertCreated()->assertJsonPath('user.role', 'user');

        $adminToken = $this->postJson('/api/auth/login', [
            'email' => 'admin@spotthea.app',
            'password' => 'Admin12345!',
        ])->assertOk()->json('token');

        $usersResponse = $this->withToken($adminToken)->getJson('/api/admin/users?q=fresh-member@example.com&page=1&pageSize=10');
        $usersResponse->assertOk();

        $registeredUser = collect($usersResponse->json('items'))->first(
            fn (array $user): bool => ($user['email'] ?? null) === 'fresh-member@example.com',
        );

        $this->assertNotNull($registeredUser);
        $this->assertSame('user', $registeredUser['role'] ?? null);
    }

    public function test_user_can_login_and_manage_profile_library_history_and_comments(): void
    {
        $login = $this->postJson('/api/auth/login', [
            'email' => 'user@spotthea.app',
            'password' => 'User12345!',
        ]);

        $login->assertOk()->assertJsonStructure(['user', 'token']);
        $token = $login->json('token');
        $this->assertIsString($token);

        $me = $this->withToken($token)->getJson('/api/me');
        $me->assertOk()->assertJsonPath('email', 'user@spotthea.app');

        $this->withToken($token)->putJson('/api/me/profile', [
            'username' => 'AsterReaderUpdated',
            'bio' => 'Updated from test flow.',
            'preferred_locale' => 'id',
        ])->assertOk()->assertJsonPath('username', 'AsterReaderUpdated');

        $manga = Manga::query()->where('slug', 'golem-and-barista')->firstOrFail();
        $chapter = Chapter::query()->where('manga_id', $manga->id)->orderByDesc('number')->firstOrFail();

        $this->withToken($token)->putJson('/api/me/library', [
            'manga_id' => $manga->id,
            'type' => 'favorites',
            'active' => true,
        ])->assertOk();

        $user = User::query()->where('email', 'user@spotthea.app')->firstOrFail();
        $this->assertDatabaseHas('library_entries', [
            'user_id' => $user->id,
            'manga_id' => $manga->id,
            'type' => 'favorites',
        ]);

        $libraryList = $this->withToken($token)->getJson('/api/me/library');
        $libraryList->assertOk();
        $this->assertNotEmpty($libraryList->json());
        $this->assertNotNull(
            collect($libraryList->json())->first(
                fn (array $item): bool => ($item['mangaId'] ?? null) === (string) $manga->id && ($item['type'] ?? null) === 'favorites',
            ),
        );

        $this->withToken($token)->putJson('/api/me/history', [
            'manga_id' => $manga->id,
            'chapter_id' => $chapter->id,
            'page_index' => 3,
            'progress_pct' => 26,
        ])->assertOk()->assertJsonPath('chapterId', (string) $chapter->id);

        $this->assertDatabaseHas('reading_histories', [
            'user_id' => $user->id,
            'manga_id' => $manga->id,
            'chapter_id' => $chapter->id,
        ]);

        $history = ReadingHistory::query()
            ->where('user_id', $user->id)
            ->where('chapter_id', $chapter->id)
            ->firstOrFail();
        $this->assertGreaterThanOrEqual(0, $history->progress_pct);

        $historyList = $this->withToken($token)->getJson('/api/me/history');
        $historyList->assertOk();
        $this->assertNotEmpty($historyList->json());
        $this->assertNotNull(
            collect($historyList->json())->first(
                fn (array $item): bool => ($item['chapterId'] ?? null) === (string) $chapter->id,
            ),
        );

        $commentResponse = $this->withToken($token)->postJson(sprintf('/api/manga/%d/comments', $manga->id), [
            'content' => 'Testing comment flow from API feature test.',
        ]);

        $commentResponse->assertCreated()->assertJsonPath('mangaId', (string) $manga->id);
        $commentId = (int) $commentResponse->json('id');

        $this->withToken($token)->postJson(sprintf('/api/comments/%d/like', $commentId))
            ->assertOk()
            ->assertJsonPath('liked', true);

        $this->withToken($token)->putJson(sprintf('/api/manga/%d/rating', $manga->id), [
            'value' => 5,
        ])->assertOk()->assertJsonPath('userRating', 5);

        $this->assertDatabaseHas('manga_ratings', [
            'user_id' => $user->id,
            'manga_id' => $manga->id,
            'value' => 5,
        ]);

        $this->withToken($token)
            ->getJson('/api/me/ratings')
            ->assertOk()
            ->assertJsonFragment([
                'mangaId' => (string) $manga->id,
                'userId' => (string) $user->id,
                'value' => 5,
            ]);

        $this->withToken($token)
            ->getJson('/api/me/comments')
            ->assertOk()
            ->assertJsonFragment([
                'id' => (string) $commentId,
                'mangaId' => (string) $manga->id,
                'userId' => (string) $user->id,
            ]);

        $this->withToken($token)->patchJson('/api/me/notifications/read-all')
            ->assertOk()
            ->assertJsonStructure(['updated']);

        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();
    }

    public function test_protected_route_requires_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/me/ratings')->assertUnauthorized();
        $this->getJson('/api/me/comments')->assertUnauthorized();
    }
}
