<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;

class MediaUploadAdminController extends Controller
{
    private const ALLOWED_UPLOAD_TYPES = ['cover', 'banner', 'site_logo', 'site_favicon', 'ad_banner'];

    private const ALLOWED_IMAGE_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/x-icon',
        'image/vnd.microsoft.icon',
    ];

    private const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'ico'];

    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function uploadMangaAsset(Request $request)
    {
        $payload = $request->validate([
            'type' => ['required', Rule::in(self::ALLOWED_UPLOAD_TYPES)],
            'file' => [
                'required',
                'file',
                'max:12288',
                'mimetypes:'.implode(',', self::ALLOWED_IMAGE_MIME_TYPES),
                'mimes:'.implode(',', self::ALLOWED_IMAGE_EXTENSIONS),
            ],
        ]);

        $file = $request->file('file');
        if ($file === null) {
            return response()->json(['message' => 'File upload tidak ditemukan.'], 422);
        }

        $type = (string) $payload['type'];
        $nameWithoutExt = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $safeName = Str::slug((string) $nameWithoutExt);
        $safeName = Str::limit($safeName, 80, '');
        $uniqueToken = strtolower((string) Str::ulid());
        $finalName = sprintf(
            '%s-%s-%s.%s',
            now()->format('YmdHis'),
            $uniqueToken,
            $safeName !== '' ? $safeName : Str::random(8),
            $extension,
        );

        $directory = match ($type) {
            'site_logo' => sprintf('site-assets/logo/%s', now()->format('Y/m')),
            'site_favicon' => sprintf('site-assets/favicon/%s', now()->format('Y/m')),
            default => sprintf('manga-assets/%s/%s', $type, now()->format('Y/m')),
        };
        $relativePath = $file->storeAs($directory, $finalName, 'public');

        if ($relativePath === false) {
            throw new RuntimeException('Gagal menyimpan file gambar.');
        }

        $absolutePath = Storage::disk('public')->path($relativePath);
        $imageSize = @getimagesize($absolutePath);
        if (! is_array($imageSize) && $type !== 'site_favicon') {
            Storage::disk('public')->delete($relativePath);

            return response()->json([
                'message' => 'File yang diunggah bukan gambar valid.',
            ], 422);
        }

        $this->auditLogService->log('admin.media.uploaded', $request->user(), null, [
            'type' => $type,
            'path' => $relativePath,
        ]);

        return response()->json([
            'type' => $type,
            'url' => $this->toPublicStorageUrl($relativePath),
            'width' => is_array($imageSize) ? (int) ($imageSize[0] ?? 0) : 0,
            'height' => is_array($imageSize) ? (int) ($imageSize[1] ?? 0) : 0,
        ]);
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
