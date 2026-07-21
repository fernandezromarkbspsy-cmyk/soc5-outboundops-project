<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class PruneOperationalData extends Command
{
    protected $signature = 'operations:prune {--notifications-days=30} {--events-days=180}';

    protected $description = 'Prune old operational notifications and request events.';

    public function handle(): int
    {
        $notificationsDays = max(1, (int) $this->option('notifications-days'));
        $eventsDays = max(1, (int) $this->option('events-days'));

        $notifications = DB::table('notifications')
            ->where('created_at', '<', now()->subDays($notificationsDays))
            ->delete();
        $events = DB::table('request_events')
            ->where('created_at', '<', now()->subDays($eventsDays))
            ->delete();

        $this->info("Pruned {$notifications} notifications and {$events} request events.");

        return self::SUCCESS;
    }
}
