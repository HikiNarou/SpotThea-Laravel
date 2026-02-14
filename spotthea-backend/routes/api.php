<?php

use App\Http\Controllers\Api\Admin\ChapterAdminController;
use App\Http\Controllers\Api\Admin\ChapterPageAdminController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\GenreAdminController;
use App\Http\Controllers\Api\Admin\MangaAdminController;
use App\Http\Controllers\Api\Admin\MediaUploadAdminController;
use App\Http\Controllers\Api\Admin\ReportAdminController;
use App\Http\Controllers\Api\Admin\SettingAdminController;
use App\Http\Controllers\Api\Admin\ThemeAdminController;
use App\Http\Controllers\Api\Admin\UserAdminController;
use App\Http\Controllers\Api\AnnouncementController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\GenreController;
use App\Http\Controllers\Api\HistoryController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\LibraryController;
use App\Http\Controllers\Api\MangaBrowseController;
use App\Http\Controllers\Api\MangaController;
use App\Http\Controllers\Api\MeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationPreferenceController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\ReaderController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SiteSettingController;
use App\Http\Controllers\Api\UpdateFeedController;
use Illuminate\Support\Facades\Route;

Route::get('/home', HomeController::class);
Route::get('/browse', MangaBrowseController::class);
Route::get('/genres', GenreController::class);
Route::get('/manga/{slug}', [MangaController::class, 'show']);
Route::get('/manga/{slug}/chapters', [MangaController::class, 'chapters']);
Route::get('/read/{slug}/{chapterId}', [ReaderController::class, 'show']);
Route::get('/updates', UpdateFeedController::class);
Route::get('/popular', [MangaBrowseController::class, 'popular']);
Route::get('/status/{status}', [MangaBrowseController::class, 'status']);
Route::get('/announcements', AnnouncementController::class);
Route::get('/site-settings', SiteSettingController::class);

Route::get('/search', [SearchController::class, 'index'])->middleware('throttle:search');
Route::get('/search/suggest', [SearchController::class, 'suggest'])->middleware('throttle:search');
Route::get('/manga/{mangaId}/comments', [CommentController::class, 'index']);
Route::get('/manga/{mangaId}/rating-summary', [RatingController::class, 'summary']);

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth');

Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:comments');
Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:auth');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

    Route::get('/me', [MeController::class, 'show']);
    Route::get('/me/overview', [MeController::class, 'overview']);
    Route::get('/me/ratings', [MeController::class, 'ratings']);
    Route::get('/me/comments', [MeController::class, 'comments']);
    Route::put('/me/profile', [MeController::class, 'updateProfile']);
    Route::put('/me/password', [MeController::class, 'updatePassword']);

    Route::get('/me/library', [LibraryController::class, 'index']);
    Route::put('/me/library', [LibraryController::class, 'upsert']);
    Route::patch('/me/library/move', [LibraryController::class, 'move']);
    Route::delete('/me/library/{mangaId}/{type}', [LibraryController::class, 'destroy']);

    Route::get('/me/history', [HistoryController::class, 'index']);
    Route::put('/me/history', [HistoryController::class, 'upsert']);
    Route::delete('/me/history', [HistoryController::class, 'clear']);
    Route::delete('/me/history/manga/{mangaId}', [HistoryController::class, 'clearByManga']);

    Route::put('/manga/{mangaId}/rating', [RatingController::class, 'upsert']);
    Route::delete('/manga/{mangaId}/rating', [RatingController::class, 'destroy']);

    Route::post('/manga/{mangaId}/comments', [CommentController::class, 'store'])->middleware('throttle:comments');
    Route::delete('/comments/{commentId}', [CommentController::class, 'destroy']);
    Route::post('/comments/{commentId}/like', [CommentController::class, 'toggleLike'])->middleware('throttle:comments');

    Route::get('/me/notifications', [NotificationController::class, 'index']);
    Route::patch('/me/notifications/{notificationId}/read', [NotificationController::class, 'markRead']);
    Route::patch('/me/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/me/notification-preferences', [NotificationPreferenceController::class, 'show']);
    Route::put('/me/notification-preferences', [NotificationPreferenceController::class, 'update']);
});

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:admin,moderator'])
    ->group(function () {
        Route::get('/dashboard', DashboardController::class);
        Route::get('/reports', [ReportAdminController::class, 'index']);
        Route::patch('/reports/{report}/status', [ReportAdminController::class, 'updateStatus']);
    });

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:admin'])
    ->group(function () {
        Route::get('/manga', [MangaAdminController::class, 'index']);
        Route::post('/manga', [MangaAdminController::class, 'store']);
        Route::get('/manga/{manga}', [MangaAdminController::class, 'show']);
        Route::patch('/manga/{manga}', [MangaAdminController::class, 'update']);
        Route::delete('/manga/{manga}', [MangaAdminController::class, 'destroy']);

        Route::get('/manga/{manga}/chapters', [ChapterAdminController::class, 'index']);
        Route::post('/manga/{manga}/chapters', [ChapterAdminController::class, 'store']);
        Route::get('/chapters/{chapter}', [ChapterAdminController::class, 'show']);
        Route::patch('/chapters/{chapter}', [ChapterAdminController::class, 'update']);
        Route::delete('/chapters/{chapter}', [ChapterAdminController::class, 'destroy']);

        Route::get('/chapters/{chapter}/pages', [ChapterPageAdminController::class, 'index']);
        Route::put('/chapters/{chapter}/pages', [ChapterPageAdminController::class, 'upsert']);
        Route::post('/chapters/{chapter}/pages/upload', [ChapterPageAdminController::class, 'upload']);
        Route::post('/chapters/{chapter}/pages/upload-zip', [ChapterPageAdminController::class, 'uploadZip']);
        Route::patch('/chapters/{chapter}/pages/reorder', [ChapterPageAdminController::class, 'reorder']);
        Route::delete('/chapters/{chapter}/pages/{page}', [ChapterPageAdminController::class, 'destroy']);

        Route::get('/genres', [GenreAdminController::class, 'index']);
        Route::post('/genres', [GenreAdminController::class, 'store']);
        Route::patch('/genres/{genre}', [GenreAdminController::class, 'update']);
        Route::delete('/genres/{genre}', [GenreAdminController::class, 'destroy']);
        Route::put('/manga/{manga}/genres', [GenreAdminController::class, 'attachToManga']);

        Route::get('/themes', [ThemeAdminController::class, 'index']);
        Route::post('/themes', [ThemeAdminController::class, 'store']);
        Route::patch('/themes/{theme}', [ThemeAdminController::class, 'update']);
        Route::delete('/themes/{theme}', [ThemeAdminController::class, 'destroy']);

        Route::post('/uploads/manga-assets', [MediaUploadAdminController::class, 'uploadMangaAsset']);

        Route::get('/users', [UserAdminController::class, 'index']);
        Route::get('/users/{user}', [UserAdminController::class, 'show']);
        Route::patch('/users/{user}/role', [UserAdminController::class, 'updateRole']);

        Route::get('/settings', [SettingAdminController::class, 'index']);
        Route::put('/settings', [SettingAdminController::class, 'update']);
        Route::get('/settings/platform', [SettingAdminController::class, 'platform']);
        Route::put('/settings/platform', [SettingAdminController::class, 'updatePlatform']);
        Route::post('/broadcast', [SettingAdminController::class, 'broadcast']);
    });
