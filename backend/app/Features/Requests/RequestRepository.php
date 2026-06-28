<?php

namespace App\Features\Requests;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

final class RequestRepository
{
    private const COLUMNS = ['id', 'request_timestamp', 'cluster', 'region', 'dock_no', 'backlogs', 'truck_size', 'truck_type', 'plate_number', 'provide_time', 'linehaul_trip_no', 'docked_time', 'status', 'rejection_remarks', 'driver_id', 'created_by', 'created_at', 'updated_at'];

    public function paginate(object $actor, array $filters): LengthAwarePaginator
    {
        $query = DB::table('requests')->select(self::COLUMNS)->orderByDesc('created_at');
        if ($actor->role === 'ops_pic') {
            $query->where('created_by', $actor->id);
        }
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }

        return $query->paginate(min((int) ($filters['per_page'] ?? 20), 100));
    }

    public function lock(string $id): object
    {
        return DB::table('requests')->where('id', $id)->lockForUpdate()->firstOrFail();
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
