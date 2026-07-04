<?php

namespace App\Features\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RequestRepository
{
    private const COLUMNS = ['id', 'request_timestamp', 'cluster', 'region', 'dock_no', 'backlogs', 'backlogs_timestamp', 'ob_fte', 'ob_ops_pic', 'midmile_fte', 'truck_size', 'truck_type', 'plate_number', 'provide_time', 'linehaul_trip_no', 'docked_time', 'status', 'rejection_remarks', 'driver_id', 'created_by', 'created_at', 'updated_at'];

    public function paginate(object $actor, array $filters): LengthAwarePaginator
    {
        $query = $this->visibleRequestQuery();
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('r.created_by', $actor->id);
        }
        if ($status = $filters['status'] ?? null) {
            $query->where('r.status', $status);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->whereRaw("lower(coalesce(r.plate_number, '')) like ?", ['%'.strtolower($search).'%']);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->where('r.request_timestamp', '>=', CarbonImmutable::parse($dateFrom, 'Asia/Manila')->startOfDay()->utc());
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->where('r.request_timestamp', '<=', CarbonImmutable::parse($dateTo, 'Asia/Manila')->endOfDay()->utc());
        }

        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';
        $query->orderBy('r.'.$sort, $direction)->orderByDesc('r.id');

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

        $timezone = 'Asia/Manila';
        $rangeStart = isset($filters['date_from'])
            ? CarbonImmutable::parse($filters['date_from'], $timezone)->startOfDay()
            : CarbonImmutable::now($timezone)->startOfDay();
        $rangeEnd = isset($filters['date_to'])
            ? CarbonImmutable::parse($filters['date_to'], $timezone)->endOfDay()
            : CarbonImmutable::now($timezone)->endOfDay();
        $hourlyQuery = DB::table('requests')->whereBetween('request_timestamp', [$rangeStart->utc(), $rangeEnd->utc()]);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $hourlyQuery->where('created_by', $actor->id);
        }
        $timestamps = $hourlyQuery->pluck('request_timestamp');
        $counts = array_fill(0, 24, 0);
        foreach ($timestamps as $timestamp) {
            $hour = CarbonImmutable::parse($timestamp)->setTimezone($timezone)->hour;
            $counts[$hour]++;
        }

        return [
            'truck_sizes' => $sizes->pluck('total', 'truck_size'),
            'hourly' => collect($counts)->map(fn (int $count, int $hour) => [
                'label' => CarbonImmutable::createFromTime($hour, 0, 0, $timezone)->format('g A'),
                'count' => $count,
            ])->values(),
            'range_start' => $rangeStart->toIso8601String(),
            'range_end' => $rangeEnd->toIso8601String(),
        ];
    }

    private function scope($query, object $actor, array $filters): void
    {
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $query->where('request_timestamp', '>=', CarbonImmutable::parse($dateFrom, 'Asia/Manila')->startOfDay()->utc());
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->where('request_timestamp', '<=', CarbonImmutable::parse($dateTo, 'Asia/Manila')->endOfDay()->utc());
        }
    }

    public function lock(string $id): object
    {
        return DB::table('requests')->where('id', $id)->lockForUpdate()->firstOrFail();
    }

    public function findVisible(string $id, object $actor): object
    {
        $query = $this->visibleRequestQuery()->where('r.id', $id);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('r.created_by', $actor->id);
        }

        return $query->firstOrFail();
    }

    private function visibleRequestQuery()
    {
        $columns = array_map(static fn (string $column): string => 'r.'.$column, self::COLUMNS);

        return DB::table('requests as r')
            ->leftJoin('profiles as creator', 'creator.id', '=', 'r.created_by')
            ->select([...$columns, 'creator.name as requested_by'])
            ->selectSub(function ($query): void {
                $query->from('request_events as docking_event')
                    ->join('profiles as docking_user', 'docking_user.id', '=', 'docking_event.actor_id')
                    ->select('docking_user.name')
                    ->whereColumn('docking_event.request_id', 'r.id')
                    ->where('docking_event.event_type', 'TRUCK_DOCKED')
                    ->orderByDesc('docking_event.id')
                    ->limit(1);
            }, 'doc_officer');
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
