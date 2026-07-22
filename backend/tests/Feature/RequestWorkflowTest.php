<?php

namespace Tests\Feature;

use App\Features\Notifications\NotificationOutboxDispatcher;
use App\Features\Requests\RequestRepository;
use App\Features\Requests\RequestService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class RequestWorkflowTest extends TestCase
{
    private RequestRepository $repository;

    private RequestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated request workflow tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        $this->createSchema();
        $this->repository = new RequestRepository;
        $this->service = new RequestService($this->repository, new NotificationOutboxDispatcher);
    }

    public function test_fte_ops_can_edit_a_pending_request(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops'];

        $updated = $this->service->updateDetails($request->id, $actor, [
            'cluster' => 'SOC 6',
            'region' => 'NCR',
            'dock_no' => 'D-12',
            'backlogs' => 42,
            'truck_size' => '10W',
            'truck_type' => 'DRYLEASE',
        ]);

        $this->assertSame('SOC 6', $updated->cluster);
        $this->assertDatabaseHas('request_events', ['request_id' => $request->id, 'event_type' => 'REQUEST_EDITED']);
    }

    public function test_fte_ops_rejection_cancels_the_request(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops'];

        $updated = $this->service->transition($request->id, $actor, 'reject-ops', []);

        $this->assertSame('CANCELLED', $updated->status);
        $this->assertDatabaseHas('request_events', ['request_id' => $request->id, 'event_type' => 'REQUEST_REJECTED_BY_OPS']);
    }

    public function test_request_list_filters_by_plate_and_date(): void
    {
        $this->insertRequest(['plate_number' => 'ABC-1234', 'request_timestamp' => '2026-06-15 08:00:00']);
        $this->insertRequest(['plate_number' => 'XYZ-9000', 'request_timestamp' => '2026-05-10 08:00:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $result = $this->repository->paginate($actor, [
            'search' => 'abc',
            'date_from' => '2026-06-01',
            'date_to' => '2026-06-30',
            'sort' => 'plate_number',
            'direction' => 'asc',
            'per_page' => 20,
        ]);

        $this->assertSame(1, $result->total());
        $this->assertSame('ABC-1234', $result->items()[0]->plate_number);
    }

    public function test_transition_rejects_stale_request_version(): void
    {
        $request = $this->insertRequest(['status' => 'PENDING', 'updated_at' => '2026-06-30 08:00:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops'];

        $this->expectException(HttpException::class);

        $this->service->transition(
            $request->id,
            $actor,
            'approve',
            [],
            CarbonImmutable::parse('2026-06-29 08:00:00')->toIso8601String()
        );
    }

    public function test_request_repository_supports_cursor_pagination(): void
    {
        $first = $this->insertRequest(['created_at' => '2026-06-30 09:00:00', 'updated_at' => '2026-06-30 09:00:00']);
        $second = $this->insertRequest(['created_at' => '2026-06-30 08:00:00', 'updated_at' => '2026-06-30 08:00:00']);
        $third = $this->insertRequest(['created_at' => '2026-06-30 07:00:00', 'updated_at' => '2026-06-30 07:00:00']);
        $actor = (object) ['id' => (string) Str::uuid(), 'role' => 'fte_mm'];

        $pageOne = $this->repository->paginate($actor, [
            'sort' => 'created_at',
            'direction' => 'desc',
            'per_page' => 2,
            'cursor' => base64_encode(json_encode(['created_at' => '2026-06-30 10:00:00', 'id' => (string) Str::uuid()])),
        ]);

        $this->assertCount(2, $pageOne['data']);
        $this->assertSame($first->id, $pageOne['data'][0]->id);
        $this->assertSame($second->id, $pageOne['data'][1]->id);
        $this->assertNotNull($pageOne['next_cursor']);

        $pageTwo = $this->repository->paginate($actor, [
            'sort' => 'created_at',
            'direction' => 'desc',
            'per_page' => 2,
            'cursor' => $pageOne['next_cursor'],
        ]);

        $this->assertCount(1, $pageTwo['data']);
        $this->assertSame($third->id, $pageTwo['data'][0]->id);
    }

    private function insertRequest(array $overrides = []): object
    {
        $id = (string) Str::uuid();
        DB::table('requests')->insert(array_merge([
            'id' => $id,
            'request_timestamp' => '2026-06-30 08:00:00',
            'cluster' => 'SOC 5',
            'region' => 'NCR',
            'dock_no' => 'D-01',
            'backlogs' => 10,
            'truck_size' => '6W',
            'truck_type' => 'WETLEASE',
            'plate_number' => null,
            'status' => 'PENDING',
            'created_by' => (string) Str::uuid(),
            'created_at' => '2026-06-30 08:00:00',
            'updated_at' => '2026-06-30 08:00:00',
        ], $overrides));

        return DB::table('requests')->where('id', $id)->first();
    }

    private function createSchema(): void
    {
        Schema::create('requests', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->dateTime('request_timestamp');
            $table->string('cluster');
            $table->string('region');
            $table->string('dock_no');
            $table->integer('backlogs');
            $table->dateTime('backlogs_timestamp')->nullable();
            $table->string('ob_fte')->nullable();
            $table->string('truck_size');
            $table->string('truck_type');
            $table->string('plate_number')->nullable();
            $table->dateTime('provide_time')->nullable();
            $table->string('linehaul_trip_no')->nullable();
            $table->dateTime('docked_time')->nullable();
            $table->string('status');
            $table->text('rejection_remarks')->nullable();
            $table->string('driver_id')->nullable();
            $table->uuid('created_by');
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();
            $table->dateTime('confirmed_at')->nullable();
            $table->timestamps();
        });
        Schema::create('request_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id');
            $table->string('event_type');
            $table->uuid('actor_id')->nullable();
            $table->string('from_status')->nullable();
            $table->string('to_status')->nullable();
            $table->text('metadata');
            $table->string('correlation_id')->nullable();
            $table->timestamps();
        });
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
        Schema::create('notification_outbox', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->dateTime('processed_at')->nullable();
            $table->timestamps();
        });
    }
}
