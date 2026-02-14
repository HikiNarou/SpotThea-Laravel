<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService) {}

    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'] ?? $data['username'],
            'username' => $data['username'],
            'email' => Str::lower($data['email']),
            'role' => 'user',
            'password' => $data['password'],
            'preferred_locale' => $data['preferred_locale'] ?? 'id',
            'avatar_url' => sprintf('https://picsum.photos/seed/%s/120/120', urlencode($data['username'])),
        ]);

        NotificationPreference::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['email' => true, 'push' => false, 'quiet_hours_start' => '22:00', 'quiet_hours_end' => '07:00'],
        );

        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;
        $this->auditLogService->log('auth.register', $user, $user, ['email' => $user->email]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        /** @var User|null $user */
        $user = User::query()
            ->where('email', Str::lower($data['email']))
            ->first();

        if ($user === null || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;
        $this->auditLogService->log('auth.login', $user, $user);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        $request->user()?->currentAccessToken()?->delete();

        if ($user !== null) {
            $this->auditLogService->log('auth.logout', $user, $user);
        }

        return response()->noContent();
    }

    public function logoutAll(Request $request)
    {
        $user = $request->user();
        $user?->tokens()->delete();

        if ($user !== null) {
            $this->auditLogService->log('auth.logout_all', $user, $user);
        }

        return response()->noContent();
    }

    public function forgotPassword(Request $request)
    {
        $payload = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $status = Password::sendResetLink([
            'email' => Str::lower($payload['email']),
        ]);

        return response()->json([
            'status' => $status === Password::RESET_LINK_SENT ? 'ok' : 'error',
            'message' => __($status),
        ], $status === Password::RESET_LINK_SENT ? 200 : 422);
    }

    public function resetPassword(Request $request)
    {
        $payload = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:120', 'confirmed'],
        ]);

        $status = Password::reset(
            [
                'email' => Str::lower($payload['email']),
                'password' => $payload['password'],
                'password_confirmation' => (string) $request->input('password_confirmation'),
                'token' => $payload['token'],
            ],
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();
            },
        );

        return response()->json([
            'status' => $status === Password::PASSWORD_RESET ? 'ok' : 'error',
            'message' => __($status),
        ], $status === Password::PASSWORD_RESET ? 200 : 422);
    }
}
