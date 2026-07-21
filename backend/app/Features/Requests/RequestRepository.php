<?php

namespace App\Features\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RequestRepository
{
    private const COLUMNS = ['id', 'request_timestamp', 'cluster', 'region', 'dock_no', 'backlogs', 'backlogs_timestamp', 'ob_fte', 'truck_size', 'truck_type', 'plate_number', 'provide_time', 'linehaul_trip_no', 'docked_time', 'status', 'rejection_remarks', 'driver_id', 'created_by', 'created_at', 'updated_at'];

    public function paginate(object $actor, array $filters): array|\Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = DB::table('requests')->select(self::COLUMNS);
        $this->scopeActor($query, $actor);
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->whereRaw("lower(coalesce(plate_number, '')) like ?", ['%'.strtolower($search).'%']);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('request_timestamp', '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('request_timestamp', '<=', $dateTo);
        }

        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';

        if (($filters['cursor'] ?? null) && $sort === 'created_at') {
            return $this->cursorPaginate($query, $filters, $direction);
        }

        $query->orderBy($sort, $direction)->orderByDesc('id');

        return $query->paginate(min((int) ($filters['per_page'] ?? 20), 100));
    }

    public function metrics(object $actor, array $filters = []): Collection
    {
        $query = DB::table('requests')->select('status', DB::raw('count(*) as total'))->groupBy('status');
        $this->scope($query, $actor, $filters);

        return $query->pluck('total', 'status');
    }

    public function analytics(object $actor, array $filters = []): array
    {
        $sizes = DB::table('requests')->select('truck_size', DB::raw('count(*) as total'))->groupBy('truck_size');
        $this->scope($sizes, $actor, $filters);

        $range = $filters['range'] ?? 'shift';
        $timezone = 'Asia/Manila';
        $now = CarbonImmutable::now($timezone);

        if ($range === 'weekly') {
            $start = isset($filters['date_from'])
                ? CarbonImmutable::parse($filters['date_from'], $timezone)->startOfDay()
                : $now->startOfWeek(CarbonImmutable::MONDAY);
            $end = isset($filters['date_to'])
                ? CarbonImmutable::parse($filters['date_to'], $timezone)->endOfDay()
                : $start->addDays(6)->endOfDay();

            $series = $this->bucketCounts($actor, $start, $end, $timezone, fn (CarbonImmutable $bucket) => $bucket->format('D'));

            return [
                'truck_sizes' => $sizes->pluck('total', 'truck_size'),
                'hourly' => $series,
                'range' => 'weekly',
                'shift_start' => $start->toIso8601String(),
            ];
        }

        if ($range === 'monthly') {
            $end = isset($filters['date_to'])
                ? CarbonImmutable::parse($filters['date_to'], $timezone)->endOfDay()
                : $now->endOfDay();
            $start = isset($filters['date_from'])
                ? CarbonImmutable::parse($filters['date_from'], $timezone)->startOfDay()
                : $end->subDays(29)->startOfDay();

            $series = $this->bucketCounts($actor, $start, $end, $timezone, fn (CarbonImmutable $bucket) => $bucket->format('M j'));

            return [
                'truck_sizes' => $sizes->pluck('total', 'truck_size'),
                'hourly' => $series,
                'range' => 'monthly',
                'shift_start' => $start->toIso8601String(),
            ];
        }

        $shiftStart = $now->hour < 6
            ? $now->subDay()->setTime(18, 0)
            : $now->setTime(18, 0);
        $shiftEnd = $shiftStart->addHours(13);
        $shiftQuery = DB::table('requests')->whereBetween('request_timestamp', [$shiftStart->utc(), $shiftEnd->utc()]);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $shiftQuery->where('created_by', $actor->id);
        }
        $timestamps = $shiftQuery->pluck('request_timestamp');
        $counts = array_fill(0, 13, 0);
        foreach ($timestamps as $timestamp) {
            $index = $shiftStart->diffInHours(CarbonImmutable::parse($timestamp)->setTimezone($timezone), false);
            if ($index >= 0 && $index <= 12) {
                $counts[$index]++;
            }
        }

        return [
            'truck_sizes' => $sizes->pluck('total', 'truck_size'),
            'hourly' => collect($counts)->map(fn (int $count, int $hour) => [
                'label' => $shiftStart->addHours($hour)->format('gA'),
                'count' => $count,
            ])->values(),
            'range' => 'shift',
            'shift_start' => $shiftStart->toIso8601String(),
        ];
    }

    private function bucketCounts(object $actor, CarbonImmutable $start, CarbonImmutable $end, string $timezone, callable $label): array
    {
        $query = DB::table('requests')->whereBetween('request_timestamp', [$start->utc(), $end->utc()]);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }

        $counts = [];
        $cursor = $start->startOfDay();
        while ($cursor <= $end) {
            $counts[$cursor->toDateString()] = 0;
            $cursor = $cursor->addDay();
        }

        foreach ($query->pluck('request_timestamp') as $timestamp) {
            $key = CarbonImmutable::parse($timestamp)->setTimezone($timezone)->toDateString();
            if (array_key_exists($key, $counts)) {
                $counts[$key]++;
            }
        }

        return collect($counts)->map(fn (int $count, string $key) => [
            'label' => $label(CarbonImmutable::parse($key, $timezone)),
            'count' => $count,
        ])->values()->all();
    }

    private function scope($query, object $actor, array $filters): void
    {
        $this->scopeActor($query, $actor);
        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->whereDate('request_timestamp', '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('request_timestamp', '<=', $dateTo);
        }
    }

    private function scopeActor($query, object $actor): void
    {
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }
    }

    private function cursorPaginate($query, array $filters, string $direction): array
    {
        $cursor = json_decode(base64_decode((string) $filters['cursor'], true) ?: '', true);
        $perPage = min((int) ($filters['per_page'] ?? 20), 100);
        $forward = ($filters['cursor_direction'] ?? 'next') !== 'prev';

        if (is_array($cursor) && isset($cursor['created_at'], $cursor['id'])) {
            $operator = $direction === 'desc'
                ? ($forward ? '<' : '>')
                : ($forward ? '>' : '<');

            $query->where(function ($builder) use ($cursor, $operator): void {
                $builder->where('created_at', $operator, $cursor['created_at'])
                    ->orWhere(function ($nested) use ($cursor, $operator): void {
                        $nested->where('created_at', '=', $cursor['created_at'])
                            ->where('id', $operator, $cursor['id']);
                    });
            });
        }

        $effectiveDirection = $forward ? $direction : ($direction === 'desc' ? 'asc' : 'desc');
        $rows = $query->orderBy('created_at', $effectiveDirection)->orderBy('id', $effectiveDirection)->limit($perPage + 1)->get();
        if (! $forward) {
            $rows = $rows->reverse()->values();
        }

        $hasMore = $rows->count() > $perPage;
        $items = $rows->take($perPage)->values();
        $nextCursor = null;
        $prevCursor = null;

        if ($items->isNotEmpty()) {
            $last = $items->last();
            $first = $items->first();
            $nextCursor = $hasMore ? base64_encode(json_encode(['created_at' => $last->created_at, 'id' => $last->id], JSON_THROW_ON_ERROR)) : null;
            $prevCursor = is_array($cursor) ? base64_encode(json_encode(['created_at' => $first->created_at, 'id' => $first->id], JSON_THROW_ON_ERROR)) : null;
        }

        return [
            'data' => $items,
            'per_page' => $perPage,
            'next_cursor' => $nextCursor,
            'prev_cursor' => $prevCursor,
            'has_more' => $hasMore,
        ];
    }

    public function lock(string $id): object
    {
        return DB::table('requests')->where('id', $id)->lockForUpdate()->firstOrFail();
    }

    public function findVisible(string $id, object $actor): object
    {
        $query = DB::table('requests')->select(self::COLUMNS)->where('id', $id);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }

        return $query->firstOrFail();
    }

    public function events(string $id, object $actor): Collection
    {
        $this->findVisible($id, $actor);

        return DB::table('request_events')->where('request_id', $id)->orderByDesc('created_at')->get();
    }

    public function insert(array $data): object
    {
        $id = DB::table('requests')->insertGetId($data, 'id');

        return DB::table('requests')->where('id', $id)->first();
    }

    public function update(string $id, array $data): object
    {
        DB::table('requests')->where('id', $id)->update($data);

        return DB::table('requests')->where('id', $id)->first();
    }
}
