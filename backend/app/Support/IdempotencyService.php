<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class IdempotencyService
{
    public function begin(Request $request, string $actorId): ?JsonResponse
    {
        $key = trim((string) $request->header('Idempotency-Key'));
        if ($key === '') {
            return null;
        }

        $path = $request->path();
        $method = strtoupper($request->method());
        $hash = hash('sha256', $request->getContent());

        $record = DB::table('idempotency_keys')->where([
            'actor_id' => $actorId,
            'request_method' => $method,
            'request_path' => $path,
            'idempotency_key' => $key,
        ])->first();

        if (! $record) {
            DB::table('idempotency_keys')->insert([
                'actor_id' => $actorId,
                'request_method' => $method,
                'request_path' => $path,
                'idempotency_key' => $key,
                'request_hash' => $hash,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return null;
        }

        abort_unless(hash_equals((string) $record->request_hash, $hash), 409, 'Idempotency key reuse with a different payload is not allowed.');

        if ($record->response_body !== null) {
            return response()->json(
                json_decode((string) $record->response_body, true) ?? [],
                (int) $record->response_status
            )->header('X-Idempotent-Replay', 'true');
        }

        abort(409, 'A matching request is already being processed.');
    }

    public function complete(Request $request, string $actorId, JsonResponse $response): void
    {
        $key = trim((string) $request->header('Idempotency-Key'));
        if ($key === '') {
            return;
        }

        DB::table('idempotency_keys')->where([
            'actor_id' => $actorId,
            'request_method' => strtoupper($request->method()),
            'request_path' => $request->path(),
            'idempotency_key' => $key,
        ])->update([
            'response_status' => $response->getStatusCode(),
            'response_body' => $response->getContent(),
            'updated_at' => now(),
        ]);
    }
}
