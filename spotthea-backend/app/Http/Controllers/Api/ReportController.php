<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportStoreRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Services\AuditLogService;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function store(ReportStoreRequest $request)
    {
        $payload = $request->validated();
        $user = $request->user();

        $report = Report::query()->create([
            'reporter_user_id' => $user?->id,
            'type' => $payload['type'],
            'target_id' => $payload['target_id'] ?? '',
            'reason' => $payload['reason'],
            'details' => $payload['details'] ?? null,
            'status' => 'open',
        ]);

        $this->auditLogService->log('report.created', $user, $report, $payload);

        return (new ReportResource($report))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
