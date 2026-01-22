<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    /**
     * Get current USD to NGN exchange rate
     * Uses exchangerate-api.com (free tier: 1,500 requests/month)
     * Falls back to cached rate or default if API fails
     */
    public function getUsdToNgnRate(): float
    {
        try {
            // Cache for 1 hour (rates don't change that frequently)
            return Cache::remember('usd_to_ngn_rate', 3600, function () {
                // Try primary API - exchangerate-api.com (free, no key required for USD)
                $rate = $this->fetchFromExchangeRateApi();

                if ($rate) {
                    Log::info('Exchange rate fetched successfully', ['rate' => $rate, 'source' => 'exchangerate-api']);
                    return $rate;
                }

                // Fallback to CBN (Central Bank of Nigeria) if available
                $rate = $this->fetchFromCBN();

                if ($rate) {
                    Log::info('Exchange rate fetched from CBN', ['rate' => $rate]);
                    return $rate;
                }

                // Final fallback to reasonable default
                Log::warning('Using fallback exchange rate');
                return $this->getFallbackRate();
            });
        } catch (\Exception $e) {
            Log::error('Exchange rate fetch failed', ['error' => $e->getMessage()]);
            return $this->getFallbackRate();
        }
    }

    /**
     * Fetch rate from exchangerate-api.com
     */
    protected function fetchFromExchangeRateApi(): ?float
    {
        try {
            $response = Http::timeout(5)->get('https://api.exchangerate-api.com/v4/latest/USD');

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['rates']['NGN'])) {
                    return (float) $data['rates']['NGN'];
                }
            }
        } catch (\Exception $e) {
            Log::warning('ExchangeRate API failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Fetch rate from CBN (backup)
     */
    protected function fetchFromCBN(): ?float
    {
        try {
            // CBN doesn't have a public API, but we can try other free APIs
            $response = Http::timeout(5)->get('https://open.er-api.com/v6/latest/USD');

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['rates']['NGN'])) {
                    return (float) $data['rates']['NGN'];
                }
            }
        } catch (\Exception $e) {
            Log::warning('Backup exchange API failed', ['error' => $e->getMessage()]);
        }

        return null;
    }

    /**
     * Get fallback rate (updated periodically based on market rates)
     */
    protected function getFallbackRate(): float
    {
        // Conservative fallback rate (updated: Jan 2025)
        // Check current rates at: https://www.xe.com/currency-converter/usd-to-ngn
        return 1600.0;
    }

    /**
     * Clear cached exchange rate (useful for manual refresh)
     */
    public function clearCache(): void
    {
        Cache::forget('usd_to_ngn_rate');
    }

    /**
     * Get exchange rate info with metadata
     */
    public function getRateInfo(): array
    {
        $rate = $this->getUsdToNgnRate();
        $cacheKey = 'usd_to_ngn_rate';

        return [
            'rate' => $rate,
            'cached' => Cache::has($cacheKey),
            'cache_expires_in_seconds' => Cache::has($cacheKey) ? 3600 : 0,
            'last_updated' => now()->toDateTimeString(),
        ];
    }
}
