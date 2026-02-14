<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ChapterPageReorderRequest;
use App\Http\Resources\ChapterPageResource;
use App\Models\Chapter;
use App\Models\ChapterPage;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use ZipArchive;

class ChapterPageAdminController extends Controller
{
    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif',
    ];

    private const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Chapter $chapter)
    {
        $chapter->load('pages');

        return ChapterPageResource::collection($chapter->pages);
    }

    public function upsert(Request $request, Chapter $chapter)
    {
        $payload = $request->validate([
            'pages' => ['required', 'array', 'min:1'],
            'pages.*.id' => ['sometimes', 'integer', 'exists:chapter_pages,id'],
            'pages.*.image_url' => ['required', 'url', 'max:2048'],
            'pages.*.width' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:10000'],
            'pages.*.height' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:10000'],
        ]);

        DB::transaction(function () use ($chapter, $payload): void {
            foreach (array_values($payload['pages']) as $index => $pagePayload) {
                if (isset($pagePayload['id'])) {
                    ChapterPage::query()
                        ->where('chapter_id', $chapter->id)
                        ->whereKey((int) $pagePayload['id'])
                        ->update([
                            'page_index' => $index,
                            'image_url' => $pagePayload['image_url'],
                            'width' => $pagePayload['width'] ?? null,
                            'height' => $pagePayload['height'] ?? null,
                        ]);
                } else {
                    ChapterPage::query()->create([
                        'chapter_id' => $chapter->id,
                        'page_index' => $index,
                        'image_url' => $pagePayload['image_url'],
                        'width' => $pagePayload['width'] ?? null,
                        'height' => $pagePayload['height'] ?? null,
                    ]);
                }
            }

            $chapter->update([
                'pages_count' => $chapter->pages()->count(),
            ]);
        });

        $chapter->load('pages');
        $this->auditLogService->log('admin.chapter_page.upserted', $request->user(), $chapter);

        return ChapterPageResource::collection($chapter->pages);
    }

    public function upload(Request $request, Chapter $chapter)
    {
        $payload = $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:250'],
            'files.*' => [
                'required',
                'file',
                'max:12288',
                'mimetypes:'.implode(',', self::ALLOWED_IMAGE_MIME_TYPES),
                'mimes:'.implode(',', self::ALLOWED_IMAGE_EXTENSIONS),
            ],
        ]);

        /** @var array<int, UploadedFile> $files */
        $files = $payload['files'];
        $items = $this->storeUploadedImages($chapter, $files);

        $this->auditLogService->log('admin.chapter_page.uploaded_images', $request->user(), $chapter, [
            'count' => count($items),
        ]);

        return response()->json([
            'items' => $items,
        ]);
    }

    public function uploadZip(Request $request, Chapter $chapter)
    {
        $payload = $request->validate([
            'archive' => ['required', 'file', 'mimes:zip', 'max:102400'],
        ]);

        if (!class_exists(ZipArchive::class)) {
            return response()->json([
                'message' => 'PHP extension zip belum tersedia di server.',
            ], 500);
        }

        /** @var UploadedFile $archive */
        $archive = $payload['archive'];
        $items = $this->storeZipImages($chapter, $archive);

        if (count($items) === 0) {
            return response()->json([
                'message' => 'File ZIP tidak berisi gambar yang didukung.',
            ], 422);
        }

        $this->auditLogService->log('admin.chapter_page.uploaded_zip', $request->user(), $chapter, [
            'count' => count($items),
        ]);

        return response()->json([
            'items' => $items,
        ]);
    }

    public function reorder(ChapterPageReorderRequest $request, Chapter $chapter)
    {
        $payload = $request->validated();
        $pageIds = $payload['page_ids'];

        $existing = ChapterPage::query()
            ->where('chapter_id', $chapter->id)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        $normalizedIncoming = array_map(static fn ($id): int => (int) $id, $pageIds);
        sort($existing);
        $incomingSorted = $normalizedIncoming;
        sort($incomingSorted);

        if ($existing !== $incomingSorted) {
            return response()->json([
                'message' => 'Page IDs must include all pages in this chapter.',
            ], 422);
        }

        DB::transaction(function () use ($chapter, $normalizedIncoming): void {
            foreach ($normalizedIncoming as $index => $pageId) {
                ChapterPage::query()
                    ->where('chapter_id', $chapter->id)
                    ->whereKey($pageId)
                    ->update(['page_index' => -($index + 1)]);
            }

            foreach ($normalizedIncoming as $index => $pageId) {
                ChapterPage::query()
                    ->where('chapter_id', $chapter->id)
                    ->whereKey($pageId)
                    ->update(['page_index' => $index]);
            }
        });

        $chapter->load('pages');
        $this->auditLogService->log('admin.chapter_page.reordered', $request->user(), $chapter);

        return ChapterPageResource::collection($chapter->pages);
    }

    public function destroy(Request $request, Chapter $chapter, ChapterPage $page)
    {
        if ($page->chapter_id !== $chapter->id) {
            return response()->json(['message' => 'Page does not belong to chapter.'], 422);
        }

        $page->delete();

        $remainingIds = ChapterPage::query()
            ->where('chapter_id', $chapter->id)
            ->orderBy('page_index')
            ->pluck('id');

        foreach ($remainingIds as $index => $id) {
            ChapterPage::query()->whereKey($id)->update(['page_index' => $index]);
        }

        $chapter->update(['pages_count' => $chapter->pages()->count()]);
        $this->auditLogService->log('admin.chapter_page.deleted', $request->user(), $page);

        return response()->noContent();
    }

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array<int, array{index:int,imageUrl:string,width:int,height:int,sourceName:string}>
     */
    private function storeUploadedImages(Chapter $chapter, array $files): array
    {
        usort($files, static fn (UploadedFile $left, UploadedFile $right): int => strnatcasecmp(
            $left->getClientOriginalName(),
            $right->getClientOriginalName(),
        ));

        $directory = $this->resolveStorageDirectory($chapter);
        $stored = [];

        foreach ($files as $position => $file) {
            $originalName = $file->getClientOriginalName();
            $fallbackName = sprintf('page-%d', $position + 1);
            $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');

            if (!in_array($extension, self::ALLOWED_IMAGE_EXTENSIONS, true)) {
                continue;
            }

            $preferredName = $this->sanitizeFileNameForStorage($originalName);
            if ($preferredName === '') {
                $preferredName = sprintf('%s.%s', $fallbackName, $extension);
            }
            $storedName = $this->resolveUniqueStorageName($directory, $preferredName, $fallbackName, $extension);

            $relativePath = $file->storeAs($directory, $storedName, 'public');

            if ($relativePath === false) {
                throw new RuntimeException('Gagal menyimpan file halaman chapter.');
            }

            [$width, $height] = $this->detectImageDimensions($file->getRealPath());

            $stored[] = [
                'index' => count($stored),
                'imageUrl' => $this->toPublicStorageUrl($relativePath),
                'width' => $width,
                'height' => $height,
                'sourceName' => $originalName !== '' ? basename($originalName) : $storedName,
            ];
        }

        return $stored;
    }

    /**
     * @return array<int, array{index:int,imageUrl:string,width:int,height:int,sourceName:string}>
     */
    private function storeZipImages(Chapter $chapter, UploadedFile $archive): array
    {
        $archivePath = $archive->getRealPath();
        if ($archivePath === false) {
            throw new RuntimeException('File ZIP tidak valid.');
        }

        $zip = new ZipArchive();
        $opened = $zip->open($archivePath);
        if ($opened !== true) {
            throw new RuntimeException('Tidak dapat membuka file ZIP.');
        }

        $entries = [];
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $entryStats = $zip->statIndex($index);
            if (!is_array($entryStats) || !array_key_exists('name', $entryStats)) {
                continue;
            }

            $entryName = (string) $entryStats['name'];
            if (str_ends_with($entryName, '/')) {
                continue;
            }

            $extension = strtolower((string) pathinfo($entryName, PATHINFO_EXTENSION));
            if (!in_array($extension, self::ALLOWED_IMAGE_EXTENSIONS, true)) {
                continue;
            }

            $entries[] = [
                'index' => $index,
                'name' => $entryName,
            ];
        }

        usort(
            $entries,
            static fn (array $left, array $right): int => strnatcasecmp(basename((string) $left['name']), basename((string) $right['name'])),
        );

        $directory = $this->resolveStorageDirectory($chapter);
        $stored = [];

        foreach ($entries as $position => $entry) {
            $entryIndex = (int) $entry['index'];
            $entryName = (string) $entry['name'];
            $stream = $zip->getStream($entryName);

            if (!is_resource($stream)) {
                continue;
            }

            $sourceName = basename($entryName);
            $extension = strtolower((string) pathinfo($sourceName, PATHINFO_EXTENSION));
            $fallbackName = sprintf('page-%d', $position + 1);
            $preferredName = $this->sanitizeFileNameForStorage($sourceName);
            if ($preferredName === '') {
                $preferredName = sprintf('%s.%s', $fallbackName, $extension !== '' ? $extension : 'jpg');
            }
            $storedName = $this->resolveUniqueStorageName($directory, $preferredName, $fallbackName, $extension !== '' ? $extension : 'jpg');
            $relativePath = sprintf('%s/%s', $directory, $storedName);
            $written = Storage::disk('public')->writeStream($relativePath, $stream);
            fclose($stream);

            if ($written !== true) {
                continue;
            }

            $absolutePath = Storage::disk('public')->path($relativePath);
            [$width, $height] = $this->detectImageDimensions($absolutePath);

            $stored[] = [
                'index' => count($stored),
                'imageUrl' => $this->toPublicStorageUrl($relativePath),
                'width' => $width,
                'height' => $height,
                'sourceName' => $sourceName !== '' ? $sourceName : sprintf('entry-%d', $entryIndex + 1),
            ];
        }

        $zip->close();

        return $stored;
    }

    private function sanitizeFileNameForStorage(string $fileName): string
    {
        $normalized = trim(str_replace(["\0", "\r", "\n"], '', basename($fileName)));
        if ($normalized === '' || $normalized === '.' || $normalized === '..') {
            return '';
        }

        $sanitized = preg_replace('/[\\\\\/:*?"<>|]+/', '_', $normalized);
        if (!is_string($sanitized)) {
            return '';
        }

        return trim($sanitized, ". \t");
    }

    private function resolveUniqueStorageName(string $directory, string $preferredName, string $fallbackBaseName, string $fallbackExtension): string
    {
        $baseName = trim((string) pathinfo($preferredName, PATHINFO_FILENAME));
        $extension = strtolower((string) pathinfo($preferredName, PATHINFO_EXTENSION));

        if ($baseName === '') {
            $baseName = $fallbackBaseName;
        }

        if ($extension === '' || !in_array($extension, self::ALLOWED_IMAGE_EXTENSIONS, true)) {
            $extension = strtolower($fallbackExtension);
        }

        if (!in_array($extension, self::ALLOWED_IMAGE_EXTENSIONS, true)) {
            $extension = 'jpg';
        }

        $candidate = sprintf('%s.%s', $baseName, $extension);
        $counter = 1;

        while (Storage::disk('public')->exists(sprintf('%s/%s', $directory, $candidate))) {
            $candidate = sprintf('%s (%d).%s', $baseName, $counter, $extension);
            $counter++;
        }

        return $candidate;
    }

    private function resolveStorageDirectory(Chapter $chapter): string
    {
        return sprintf('chapter-pages/manga-%d/chapter-%d', (int) $chapter->manga_id, (int) $chapter->id);
    }

    /**
     * @return array{0:int,1:int}
     */
    private function detectImageDimensions(string|false $path): array
    {
        if ($path === false || $path === '') {
            return [0, 0];
        }

        $imageSize = @getimagesize($path);
        if (!is_array($imageSize)) {
            return [0, 0];
        }

        return [
            max(0, (int) ($imageSize[0] ?? 0)),
            max(0, (int) ($imageSize[1] ?? 0)),
        ];
    }

    private function toPublicStorageUrl(string $relativePath): string
    {
        $storageUrl = Storage::disk('public')->url($relativePath);

        if (preg_match('/^https?:\/\//i', $storageUrl) === 1) {
            return $storageUrl;
        }

        $publicDiskUrl = trim((string) config('filesystems.disks.public.url', ''));
        if ($publicDiskUrl !== '') {
            if (preg_match('/^https?:\/\//i', $publicDiskUrl) === 1) {
                return rtrim($publicDiskUrl, '/').'/'.ltrim($relativePath, '/');
            }

            $appUrl = rtrim((string) config('app.url', ''), '/');
            if ($appUrl !== '') {
                return $appUrl.'/'.trim($publicDiskUrl, '/').'/'.ltrim($relativePath, '/');
            }
        }

        return $storageUrl;
    }
}
