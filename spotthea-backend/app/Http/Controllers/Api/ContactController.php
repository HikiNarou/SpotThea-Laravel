<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contact\ContactStoreRequest;
use App\Http\Resources\ContactMessageResource;
use App\Models\ContactMessage;
use App\Services\AuditLogService;
use Symfony\Component\HttpFoundation\Response;

class ContactController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function store(ContactStoreRequest $request)
    {
        $payload = $request->validated();

        $message = ContactMessage::query()->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'message' => $payload['message'],
            'status' => 'new',
        ]);

        $this->auditLogService->log('contact.created', $request->user(), $message);

        return (new ContactMessageResource($message))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }
}
