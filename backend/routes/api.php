<?php

use App\Features\Requests\RequestController;
use App\Features\Users\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::middleware(['supabase.auth', 'throttle:api'])->group(function (): void {
    Route::get('/auth/me', fn (Request $r) => response()->json($r->attributes->get('actor')));
    Route::post('/auth/password-changed', function (Request $request) {
        $actor = $request->attributes->get('actor');
        abort_unless($actor->role === 'ops_pic', 403, 'Only Backroom accounts use this flow.');
        DB::table('profiles')->where('id', $actor->id)->update(['must_change_password' => false, 'password_changed_at' => now(), 'updated_at' => now()]);
        return response()->json(['ok' => true]);
    });
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests', [RequestController::class, 'store']);
    Route::post('/requests/{id}/{action}', [RequestController::class, 'action'])
        ->whereIn('action', ['approve', 'cancel', 'reject-mm', 'assign-truck', 'mark-docked', 'confirm']);
});
