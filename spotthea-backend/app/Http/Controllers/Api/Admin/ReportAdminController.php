<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReportStatusUpdateRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Services\AuditLogService;
use Illuminate\Http\Request;

class ReportAdminController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function index(Request $request)
    {
        $query = Report::query()->with('reporter')->orderByDesc('created_at');
        $status = $request->query('status');
        $type = $request->query('type');

        if (is_string($status) && $status !== '') {
            $query->where('status', $status);
        }

        if (is_string($type) && $type !== '') {
            $query->where('type', $type);
        }

        return ReportResource::collection($query->paginate(max(1, min((int) $request->integer('pageSize', 30), 100))));
    }

    public function updateStatus(ReportStatusUpdateRequest $request, Report $report)
    {
        $payload = $request->validated();
        $report->update(['status' => $payload['status']]);

        $this->auditLogService->log('admin.report.status_updated', $request->user(), $report, ['status' => $payload['status']]);

        return new ReportResource($report->refresh());
    }
}
