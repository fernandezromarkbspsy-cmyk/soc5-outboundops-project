<?php

namespace App\Providers;

use App\Features\Notifications\NotificationOutboxDispatcher;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

final class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->attributes->get('actor')?->id ?? $request->ip())
        );

        app()->terminating(function (): void {
            if (app()->runningInConsole()) {
                return;
            }

            app(NotificationOutboxDispatcher::class)->dispatchPending(50);
        });
    }
}
