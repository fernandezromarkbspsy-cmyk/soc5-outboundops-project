<?php

namespace App\Features\Users;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

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
        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        $initialPassword = (string) config('services.backroom.initial_password');
        abort_if($url === '' || $key === '' || $initialPassword === '', 503, 'Backroom provisioning is not configured.');

        $response = Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
            ->timeout(10)->post($url.'/auth/v1/admin/users', [
                'email' => $email,
                'password' => $initialPassword,
                'email_confirm' => true,
                'user_metadata' => ['ops_id' => $opsId, 'account_type' => 'backroom'],
            ]);
        if (! $response->successful() || ! $response->json('id')) {
            Log::warning('Unable to create Supabase Backroom user.', [
                'status' => $response->status(),
                'ops_id' => $opsId,
                'body' => $response->json(),
            ]);
            abort(422, 'Unable to create authentication account.');
        }

        $authUserId = $response->json('id');

        try {
            $profile = DB::transaction(function () use ($authUserId, $data, $opsId) {
                $profile = DB::table('profiles')->insertGetId([
                    'id' => $authUserId, 'name' => $data['name'], 'role' => 'ops_pic',
                    'ops_id' => $opsId, 'email' => null, 'is_active' => true,
                    'must_change_password' => true, 'created_at' => now(), 'updated_at' => now(),
                ], 'id');

                if (DB::getSchemaBuilder()->hasTable('user_imports')) {
                    DB::table('user_imports')->whereRaw('lower(ops_id) = ?', [$opsId])->update([
                        'auth_user_id' => $authUserId,
                        'imported_at' => now(),
                    ]);
                }

                return $profile;
            });
        } catch (Throwable $exception) {
            Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
                ->timeout(10)->delete($url.'/auth/v1/admin/users/'.$authUserId);
            throw $exception;
        }

        return response()->json(['id' => $profile, 'name' => $data['name'], 'ops_id' => $opsId, 'must_change_password' => true], 201);
    }
}
