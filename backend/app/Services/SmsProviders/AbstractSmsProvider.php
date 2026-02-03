<?php

namespace App\Services\SmsProviders;

use App\Contracts\SmsProviderInterface;
use App\Models\ApiLog;
use Illuminate\Support\Facades\Log;

abstract class AbstractSmsProvider implements SmsProviderInterface
{
    protected string $baseUrl;
    protected string $apiKey;
    protected bool $enabled = true;

    /**
     * Log API call for monitoring
     */
    protected function logApiCall(
        string $endpoint,
        string $method,
        int $statusCode,
        int $responseTimeMs,
        ?int $userId = null
    ): void {
        try {
            ApiLog::create([
                'user_id' => $userId,
                'endpoint' => $this->getIdentifier() . ':' . $endpoint,
                'method' => $method,
                'status_code' => $statusCode,
                'response_time_ms' => $responseTimeMs,
                'ip_address' => request()->ip(),
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log API call', [
                'provider' => $this->getIdentifier(),
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Default service code mapping (can be overridden)
     */
    public function getServiceCodeMapping(): array
    {
        return [];
    }

    /**
     * Default country code mapping (can be overridden)
     */
    public function getCountryCodeMapping(): array
    {
        return [];
    }

    /**
     * Check if provider is enabled
     */
    public function isEnabled(): bool
    {
        return $this->enabled && !empty($this->apiKey);
    }

    /**
     * Map internal service code to provider-specific code
     */
    protected function mapServiceCode(string $service): string
    {
        $mapping = $this->getServiceCodeMapping();
        return $mapping[strtolower($service)] ?? $service;
    }

    /**
     * Map internal country code to provider-specific code
     */
    protected function mapCountryCode(string $country): string
    {
        $mapping = $this->getCountryCodeMapping();
        return $mapping[strtolower($country)] ?? $country;
    }
}
