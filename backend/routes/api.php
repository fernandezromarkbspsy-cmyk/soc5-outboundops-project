<?php

use App\Features\Requests\RequestController;
use App\Features\Users\UserController;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/auth/status', function () {
    abort_unless(
        filled(config('services.supabase.url')) && filled(config('services.supabase.anon_key')),
        503,
        'Authentication service is not configured.'
    );

    return response()->json(['configured' => true]);
});

Route::middleware(['supabase.auth', 'throttle:api'])->group(function (): void {
    Route::get('/auth/me', fn (Request $r) => response()->json($r->attributes->get('actor')));
    Route::post('/auth/password-changed', function (Request $request) {
        $actor = $request->attributes->get('actor');
        abort_unless($actor->role === 'ops_pic', 403, 'Only Backroom accounts use this flow.');
        $authUpdatedAt = $request->attributes->get('supabase_user_updated_at');
        abort_unless($authUpdatedAt, 409, 'Password change could not be verified.');
        abort_unless(CarbonImmutable::parse($authUpdatedAt)->greaterThan(CarbonImmutable::parse($actor->created_at)), 409, 'Change your password before continuing.');

        DB::table('profiles')->where('id', $actor->id)->update(['must_change_password' => false, 'password_changed_at' => now(), 'updated_at' => now()]);

        return response()->json(['ok' => true]);
    });
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/requests/metrics', [RequestController::class, 'metrics']);
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::post('/requests/{id}/{action}', [RequestController::class, 'action'])
        ->whereIn('action', ['approve', 'cancel', 'reject-mm', 'assign-truck', 'mark-docked', 'confirm']);
});
