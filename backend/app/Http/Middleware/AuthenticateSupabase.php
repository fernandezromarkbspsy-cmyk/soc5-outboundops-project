<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateSupabase
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->cookie('sb-access-token');
        abort_unless($token, 401, 'Authentication required.');

        $response = Http::withHeaders(['apikey' => config('services.supabase.anon_key')])
            ->withToken($token)->timeout(5)->get(config('services.supabase.url').'/auth/v1/user');
        abort_unless($response->successful(), 401, 'Invalid or expired session.');

        $profile = DB::table('profiles')->where('id', $response->json('id'))
            ->where('is_active', true)->first(['id', 'name', 'role', 'email', 'ops_id', 'must_change_password', 'password_changed_at']);
        abort_unless($profile, 403, 'Account is disabled or not provisioned.');
        $request->attributes->set('actor', $profile);

        return $next($request);
    }
}
