<?php

namespace App\Features\Users;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;

final class UserController
{
    public function store(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        abort_unless(in_array($actor->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can create Backroom accounts.');

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i', Rule::unique('profiles', 'ops_id')],
        ]);
        $opsId = strtolower($data['ops_id']);
        $email = $opsId.'@backroom.soc5.internal';
        $key = config('services.supabase.service_key');

        $response = Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
            ->timeout(10)->post(config('services.supabase.url').'/auth/v1/admin/users', [
                'email' => $email,
                'password' => 'soc5-outbound2026',
                'email_confirm' => true,
                'user_metadata' => ['ops_id' => $opsId, 'account_type' => 'backroom'],
            ]);
        abort_unless($response->successful(), 422, $response->json('msg') ?? 'Unable to create authentication account.');

        $profile = DB::table('profiles')->insertGetId([
            'id' => $response->json('id'), 'name' => $data['name'], 'role' => 'ops_pic',
            'ops_id' => $opsId, 'email' => null, 'is_active' => true,
            'must_change_password' => true, 'created_at' => now(), 'updated_at' => now(),
        ], 'id');

        return response()->json(['id' => $profile, 'name' => $data['name'], 'ops_id' => $opsId, 'must_change_password' => true], 201);
    }
}
