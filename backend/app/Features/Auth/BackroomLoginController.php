<?php

namespace App\Features\Auth;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

final class BackroomLoginController
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
            'password' => ['required', 'string'],
        ]);

        $url = rtrim((string) config('services.supabase.url'), '/');
        $anonKey = (string) config('services.supabase.anon_key');
        $serviceKey = (string) config('services.supabase.service_key');
        abort_if($url === '' || $anonKey === '' || $serviceKey === '', 503, 'Authentication service is not configured.');

        $profile = DB::table('profiles')
            ->whereRaw('lower(ops_id) = ?', [strtolower($data['ops_id'])])
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->first(['id']);

        abort_unless($profile, 401, 'Invalid OPS ID or password.');

        // Supabase password auth requires an Auth identifier. Keep that detail on
        // the server so Backroom users authenticate only with their OPS ID.
        $authUser = Http::withHeaders(['apikey' => $serviceKey, 'Authorization' => 'Bearer '.$serviceKey])
            ->timeout(10)
            ->get($url.'/auth/v1/admin/users/'.$profile->id);
        $authIdentifier = $authUser->json('email');
        abort_unless($authUser->successful() && is_string($authIdentifier) && $authIdentifier !== '', 401, 'Invalid OPS ID or password.');

        $token = Http::withHeaders(['apikey' => $anonKey])
            ->timeout(10)
            ->post($url.'/auth/v1/token?grant_type=password', [
                'email' => $authIdentifier,
                'password' => $data['password'],
            ]);

        abort_unless($token->successful(), 401, 'Invalid OPS ID or password.');

        return response()->json([
            'access_token' => $token->json('access_token'),
            'refresh_token' => $token->json('refresh_token'),
        ]);
    }
}
