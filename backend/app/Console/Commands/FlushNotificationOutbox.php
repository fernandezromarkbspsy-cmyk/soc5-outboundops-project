<?php

namespace App\Console\Commands;

use App\Features\Notifications\NotificationOutboxDispatcher;
use Illuminate\Console\Command;

final class FlushNotificationOutbox extends Command
{
    protected $signature = 'notifications:flush-outbox {--limit=100}';

    protected $description = 'Flush pending notification outbox records into notifications.';

    public function handle(NotificationOutboxDispatcher $dispatcher): int
    {
        $count = $dispatcher->dispatchPending((int) $this->option('limit'));
        $this->info("Flushed {$count} notification(s).");

        return self::SUCCESS;
    }
}
