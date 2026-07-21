<?php

namespace App\Features\Notifications;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

final class NotificationOutboxDispatcher
{
    public function enqueue(array $payload): void
    {
        DB::table('notification_outbox')->insert($payload + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function dispatchPending(int $limit = 100): int
    {
        if (! DB::getSchemaBuilder()->hasTable('notification_outbox')) {
            return 0;
        }

        $processed = 0;
        $rows = DB::table('notification_outbox')
            ->whereNull('processed_at')
            ->orderBy('id')
            ->limit($limit)
            ->get();

        foreach ($rows as $row) {
            try {
                DB::transaction(function () use ($row): void {
                    $lock = DB::table('notification_outbox')->where('id', $row->id)->lockForUpdate()->first();
                    if (! $lock || $lock->processed_at !== null) {
                        return;
                    }

                    DB::table('notifications')->insert([
                        'request_id' => $lock->request_id,
                        'user_id' => $lock->user_id,
                        'target_role' => $lock->target_role,
                        'event_type' => $lock->event_type,
                        'title' => $lock->title,
                        'body' => $lock->body,
                        'created_at' => now(),
                    ]);

                    DB::table('notification_outbox')->where('id', $lock->id)->update([
                        'processed_at' => now(),
                        'updated_at' => now(),
                    ]);
                });

                $processed++;
            } catch (Throwable $exception) {
                Log::error('Failed to flush notification outbox row.', [
                    'outbox_id' => $row->id,
                    'error' => $exception->getMessage(),
                    'correlation_id' => app()->bound('correlation_id') ? app('correlation_id') : null,
                ]);
            }
        }

        return $processed;
    }
}
