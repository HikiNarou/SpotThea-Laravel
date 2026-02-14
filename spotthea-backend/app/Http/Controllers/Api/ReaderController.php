<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChapterResource;
use App\Http\Resources\MangaResource;
use App\Services\CatalogService;
use Illuminate\Http\Request;

class ReaderController extends Controller
{
    public function __construct(private readonly CatalogService $catalogService) {}

    public function show(Request $request, string $slug, string $chapterId)
    {
        $reader = $this->catalogService->reader($slug, $chapterId);

        if ($reader === null) {
            return response()->json(['message' => 'Chapter not found.'], 404);
        }

        return response()->json([
            'manga' => new MangaResource($reader['manga']),
            'chapter' => new ChapterResource($reader['chapter']),
            'prevChapter' => $reader['prevChapter'] ? new ChapterResource($reader['prevChapter']) : null,
            'nextChapter' => $reader['nextChapter'] ? new ChapterResource($reader['nextChapter']) : null,
            'chapterOptions' => ChapterResource::collection($reader['chapterOptions']),
        ]);
    }
}
