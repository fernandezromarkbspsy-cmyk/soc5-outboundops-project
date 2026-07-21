<?php

use App\Console\Commands\ProvisionBackroomUsers;
use App\Console\Commands\FlushNotificationOutbox;
use App\Console\Commands\PruneOperationalData;
use App\Http\Middleware\ApiRequestContext;
use App\Http\Middleware\AuthenticateSupabase;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Sentry\Laravel\Integration;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', health: '/up')
    ->withCommands([ProvisionBackroomUsers::class, FlushNotificationOutbox::class, PruneOperationalData::class])
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.context' => ApiRequestContext::class,
            'supabase.auth' => AuthenticateSupabase::class,
        ]);
        $middleware->prependToPriorityList(AuthenticateSupabase::class, ApiRequestContext::class);
        $middleware->prependToPriorityList(ThrottleRequests::class, AuthenticateSupabase::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        Integration::handles($exceptions);
    })
    ->create();
