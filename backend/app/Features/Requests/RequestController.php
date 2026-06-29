<?php

namespace App\Features\Requests;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class RequestController
{
    public function __construct(private RequestRepository $repository, private RequestService $service) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->repository->paginate($request->attributes->get('actor'), $request->only('status', 'per_page')));
    }

    public function metrics(Request $request): JsonResponse
    {
        $byStatus = $this->repository->metrics($request->attributes->get('actor'));
        $awaiting = collect(['PENDING', 'APPROVED', 'ASSIGNED', 'DOCKED'])->sum(fn (string $status): int => (int) ($byStatus[$status] ?? 0));

        return response()->json([
            'total' => $byStatus->sum(),
            'awaiting_action' => $awaiting,
            'by_status' => $byStatus,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['cluster' => 'required|string|max:120', 'region' => 'required|string|max:120', 'dock_no' => 'required|string|max:50', 'backlogs' => 'required|integer|min:0', 'truck_size' => 'required|in:4W,6W,10W,6WF', 'truck_type' => 'required|in:WETLEASE,DRYLEASE']);

        return response()->json($this->service->create($request->attributes->get('actor'), $data), 201);
    }

    public function action(Request $request, string $id, string $action): JsonResponse
    {
        return response()->json($this->service->transition($id, $request->attributes->get('actor'), $action, $request->all()));
    }
}
