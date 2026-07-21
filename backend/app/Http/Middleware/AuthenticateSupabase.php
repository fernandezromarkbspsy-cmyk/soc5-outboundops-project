<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Database\QueryException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateSupabase
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->cookie('sb-access-token');
        abort_unless($token, 401, 'Authentication required.');

        $supabaseUrl = rtrim((string) config('services.supabase.url'), '/');
        $supabaseKey = (string) config('services.supabase.anon_key');
        if ($supabaseUrl === '' || $supabaseKey === '') {
            Log::error('Supabase Auth is not configured.', [
                'url_configured' => $supabaseUrl !== '',
                'key_configured' => $supabaseKey !== '',
            ]);

            abort(503, 'Authentication service is not configured.');
        }

        $authUser = $this->resolveAuthenticatedUser($request, $token, $supabaseUrl, $supabaseKey);

        try {
            $profile = DB::table('profiles')->where('id', $authUser['id'])
                ->where('is_active', true)->first(['id', 'name', 'role', 'email', 'ops_id', 'must_change_password', 'password_changed_at', 'created_at']);
        } catch (QueryException $exception) {
            Log::error('Unable to load the authenticated Supabase profile.', [
                'auth_user_id' => $authUser['id'],
                'sql_state' => $exception->errorInfo[0] ?? null,
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Account database is temporarily unavailable.');
        }
        abort_unless($profile, 403, 'Account is disabled or not provisioned.');
        $profile->is_admin = in_array(strtolower((string) $profile->email), array_map('strtolower', config('services.admin_emails', [])), true);
        $profile->original_role = $profile->role;
        $viewRole = $request->header('X-View-Role');
        if ($profile->is_admin && in_array($viewRole, ['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'], true)) {
            $profile->role = $viewRole;
        }
        $request->attributes->set('actor', $profile);
        $request->attributes->set('supabase_user_updated_at', $authUser['updated_at'] ?? null);

        if ($profile->must_change_password) {
            $allowed = [
                'GET:api/auth/me',
                'POST:api/auth/password-changed',
            ];
            abort_unless(in_array($request->method().':'.$request->path(), $allowed, true), 403, 'Password change required.');
        }

        return $next($request);
    }

    private function resolveAuthenticatedUser(Request $request, string $token, string $supabaseUrl, string $supabaseKey): array
    {
        $secret = (string) config('services.supabase.jwt_secret');
        $claims = $secret !== '' ? $this->verifyLocally($token, $secret, $supabaseUrl) : null;

        if ($claims !== null && $request->path() !== 'api/auth/password-changed') {
            return ['id' => $claims['sub'], 'updated_at' => null];
        }

        $response = $this->fetchRemoteUser($token, $supabaseUrl, $supabaseKey);

        return [
            'id' => $response->json('id'),
            'updated_at' => $response->json('updated_at'),
        ];
    }

    private function fetchRemoteUser(string $token, string $supabaseUrl, string $supabaseKey)
    {
        try {
            $response = Http::withHeaders(['apikey' => $supabaseKey])
                ->withToken($token)->connectTimeout(5)->timeout(10)
                ->get($supabaseUrl.'/auth/v1/user');
        } catch (ConnectionException $exception) {
            Log::error('Unable to reach Supabase Auth.', [
                'url' => $supabaseUrl,
                'error' => $exception->getMessage(),
            ]);

            abort(503, 'Authentication service is temporarily unavailable.');
        }

        if (! $response->successful()) {
            Log::warning('Supabase rejected an authentication token.', [
                'status' => $response->status(),
            ]);
            abort(401, 'Invalid or expired session.');
        }

        return $response;
    }

    private function verifyLocally(string $token, string $secret, string $supabaseUrl): ?array
    {
        try {
            [$encodedHeader, $encodedPayload, $encodedSignature] = explode('.', $token);
            $header = json_decode($this->base64UrlDecode($encodedHeader), true, 512, JSON_THROW_ON_ERROR);
            $payload = json_decode($this->base64UrlDecode($encodedPayload), true, 512, JSON_THROW_ON_ERROR);
            $signature = $this->base64UrlDecode($encodedSignature);
        } catch (\Throwable $exception) {
            Log::warning('Unable to decode Supabase JWT locally.', ['error' => $exception->getMessage()]);

            return null;
        }

        if (($header['alg'] ?? null) !== 'HS256') {
            return null;
        }

        $expected = hash_hmac('sha256', "{$encodedHeader}.{$encodedPayload}", $secret, true);
        if (! hash_equals($expected, $signature)) {
            return null;
        }

        $now = Carbon::now()->timestamp;
        if (($payload['exp'] ?? 0) < $now || (($payload['nbf'] ?? $now) > $now)) {
            abort(401, 'Invalid or expired session.');
        }

        $issuer = rtrim($supabaseUrl, '/').'/auth/v1';
        if (isset($payload['iss']) && $payload['iss'] !== $issuer) {
            return null;
        }

        $audience = $payload['aud'] ?? null;
        $audiences = is_array($audience) ? $audience : ($audience !== null ? [$audience] : []);
        if ($audiences !== [] && ! in_array('authenticated', $audiences, true)) {
            abort(401, 'Invalid or expired session.');
        }

        if (! isset($payload['sub']) || ! is_string($payload['sub'])) {
            abort(401, 'Invalid or expired session.');
        }

        return $payload;
    }

    private function base64UrlDecode(string $value): string
    {
        $remainder = strlen($value) % 4;
        if ($remainder !== 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($value, '-_', '+/'), true) ?: '';
    }
}
