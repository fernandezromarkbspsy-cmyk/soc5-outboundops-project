<?php

use App\Http\Middleware\AuthenticateSupabase;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias(['supabase.auth' => AuthenticateSupabase::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {})
    ->create();
