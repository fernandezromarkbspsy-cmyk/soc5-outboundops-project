<?php

namespace App\Http\Middleware;

use Illuminate\Database\QueryException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

final class ApiRequestContext
{
    public function handle(Request $request, \Closure $next): Response
    {
        $correlationId = (string) ($request->header('X-Correlation-ID') ?: Str::uuid());
        $request->attributes->set('correlation_id', $correlationId);
        app()->instance('correlation_id', $correlationId);

        try {
            $response = $next($request);
        } catch (ValidationException $exception) {
            $response = $this->errorResponse(
                $correlationId,
                422,
                'validation_failed',
                'The request payload is invalid.',
                false,
                $exception->errors()
            );
        } catch (HttpResponseException $exception) {
            $response = $exception->getResponse();
        } catch (QueryException $exception) {
            Log::error('Database query failed.', [
                'correlation_id' => $correlationId,
                'sql_state' => $exception->errorInfo[0] ?? null,
                'error' => $exception->getMessage(),
            ]);

            $response = $this->errorResponse(
                $correlationId,
                503,
                'database_unavailable',
                'A database error prevented the request from completing.',
                true
            );
        } catch (Throwable $exception) {
            if ($exception instanceof HttpExceptionInterface) {
                $status = $exception->getStatusCode();
                $response = $this->errorResponse(
                    $correlationId,
                    $status,
                    $this->codeForStatus($status),
                    $exception->getMessage() !== '' ? $exception->getMessage() : Response::$statusTexts[$status] ?? 'Request failed.',
                    $this->isRetryableStatus($status)
                );
            } else {
                Log::error('Unhandled API exception.', [
                    'correlation_id' => $correlationId,
                    'exception' => $exception::class,
                    'message' => $exception->getMessage(),
                ]);

                $response = $this->errorResponse(
                    $correlationId,
                    500,
                    'internal_error',
                    'The server hit an unexpected error.',
                    true
                );
            }
        }

        $response->headers->set('X-Correlation-ID', $correlationId);

        return $response;
    }

    private function errorResponse(
        string $correlationId,
        int $status,
        string $code,
        string $message,
        bool $retryable,
        array $fieldErrors = []
    ): JsonResponse {
        return response()->json([
            'code' => $code,
            'message' => $message,
            'field_errors' => $fieldErrors === [] ? new \stdClass : $fieldErrors,
            'retryable' => $retryable,
            'correlation_id' => $correlationId,
        ], $status);
    }

    private function codeForStatus(int $status): string
    {
        return match ($status) {
            401 => 'unauthenticated',
            403 => 'forbidden',
            404 => 'not_found',
            409 => 'conflict',
            422 => 'validation_failed',
            429 => 'rate_limited',
            503 => 'service_unavailable',
            default => 'request_failed',
        };
    }

    private function isRetryableStatus(int $status): bool
    {
        return in_array($status, [408, 425, 429, 500, 502, 503, 504], true);
    }
}
