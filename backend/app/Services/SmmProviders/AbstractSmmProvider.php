<?php

namespace App\Services\SmmProviders;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class AbstractSmmProvider
{
    protected string $baseUrl;
    protected string $apiKey;
    protected bool $enabled;

    /**
     * Make API request to provider
     */
    protected function makeRequest(array $params): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::timeout(30)
                ->connectTimeout(10)
                ->asForm()
                ->post($this->baseUrl, array_merge([
                    'key' => $this->apiKey,
                ], $params));

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            $this->logApiCall(
                $params['action'] ?? 'unknown',
                $response->status(),
                $responseTime
            );

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => 'API request failed with status ' . $response->status(),
                    'data' => null,
                ];
            }

            $data = $response->json();

            // Check for error in response
            if (isset($data['error'])) {
                return [
                    'success' => false,
                    'message' => $data['error'],
                    'data' => null,
                ];
            }

            return [
                'success' => true,
                'message' => 'Success',
                'data' => $data,
            ];
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logApiCall('error', 500, $responseTime);

            Log::error('SMM Provider API exception', [
                'provider' => $this->getIdentifier(),
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Service temporarily unavailable',
                'data' => null,
            ];
        }
    }

    /**
     * Log API call
     */
    protected function logApiCall(string $action, int $statusCode, int $responseTime): void
    {
        Log::info('SMM Provider API call', [
            'provider' => $this->getIdentifier(),
            'action' => $action,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
        ]);
    }

    /**
     * Check if provider is configured
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->baseUrl);
    }

    /**
     * Get identifier
     */
    abstract public function getIdentifier(): string;
}
