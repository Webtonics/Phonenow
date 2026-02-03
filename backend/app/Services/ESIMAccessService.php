<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ESIMAccessService
{
    protected string $apiUrl;
    protected string $accessCode;
    protected string $secretKey;
    protected int $timeout;

    public function __construct()
    {
        $this->apiUrl = config('esim.api_url');
        $this->accessCode = config('esim.access_code');
        $this->secretKey = config('esim.secret_key');
        $this->timeout = config('esim.timeout', 30);
    }

    /**
     * Generate MD5 signature for API authentication
     * Format: MD5(accessCode + secretKey + timestamp)
     */
    protected function generateSignature(int $timestamp): string
    {
        return md5($this->accessCode . $this->secretKey . $timestamp);
    }

    /**
     * Make authenticated API request
     */
    protected function request(string $method, string $endpoint, array $data = []): array
    {
        $timestamp = time();
        $signature = $this->generateSignature($timestamp);

        $headers = [
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
            'RT-AccessCode' => $this->accessCode,
            'RT-Timestamp' => (string) $timestamp,
            'RT-Sign' => $signature,
        ];

        $url = $this->apiUrl . $endpoint;

        Log::info('eSIM Access API Request', [
            'method' => $method,
            'endpoint' => $endpoint,
            'url' => $url,
            'payload' => $data,
            'has_data' => !empty($data),
        ]);

        try {
            // Package list needs MUCH longer timeout - API returns 27KB+ data
            $requestTimeout = ($endpoint === '/open/package/list') ? 120 : $this->timeout;
            $connectTimeout = ($endpoint === '/open/package/list') ? 30 : 10;

            $httpClient = Http::timeout($requestTimeout)
                ->connectTimeout($connectTimeout)
                ->withHeaders($headers)
                ->asJson(); // Force JSON encoding

            // Always send data as associative array for proper JSON object encoding
            $jsonData = empty($data) ? new \stdClass() : $data;

            $response = $httpClient->$method($url, $jsonData);

            $result = $response->json();

            // Special logging for package list to debug response structure
            if ($endpoint === '/open/package/list') {
                Log::info('eSIM Packages Raw API Response', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                    'json_result' => $result,
                ]);
            }

            Log::info('eSIM Access API Response', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'success' => $result['success'] ?? false,
            ]);

            if (!$response->successful()) {
                return [
                    'success' => false,
                    'message' => $result['message'] ?? 'API request failed',
                    'data' => null,
                ];
            }

            $data = $result['data'] ?? $result;

            return [
                'success' => true,
                'message' => $result['message'] ?? 'Success',
                'data' => $data,
            ];

        } catch (\Exception $e) {
            Log::error('eSIM Access API Error', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'API connection error: ' . $e->getMessage(),
                'data' => null,
            ];
        }
    }

    /**
     * Get account balance
     */
    public function getBalance(): array
    {
        return $this->request('post', '/open/balance/query');
    }

    /**
     * Get all available eSIM packages
     * Note: This returns a large dataset and may be slow. Consider using getPackagesByCountry() instead.
     * Cached for 1 hour to reduce API calls
     */
    public function getPackages(): array
    {
        Cache::forget('esim_access_packages');

        return Cache::remember('esim_access_packages', 3600, function () {
            Log::info('Fetching eSIM packages with extended timeout for large response');

            // The endpoint works but returns 27KB+ data - use smaller pageSize
            // and longer timeout to successfully receive the response
            return $this->request('post', '/open/package/list', [
                'pageNum' => 1,
                'pageSize' => 50, // Smaller page size for faster response
            ]);
        });
    }

    /**
     * Get packages filtered by country code
     * Much faster than getting all packages
     */
    public function getPackagesByCountryCode(string $countryCode): array
    {
        $cacheKey = 'esim_packages_' . strtolower($countryCode);
        Cache::forget($cacheKey);

        return Cache::remember($cacheKey, 3600, function () use ($countryCode) {
            Log::info('Fetching eSIM packages for country', ['country' => $countryCode]);

            // Try with country filter - API might support this
            $result = $this->request('post', '/open/package/list', [
                'pageNum' => 1,
                'pageSize' => 100,
                'countryCode' => strtoupper($countryCode),
            ]);

            // If API doesn't support country filter, it will still return results
            // We'll filter on the backend in ESIMPackageService
            return $result;
        });
    }

    /**
     * Get available countries
     * Returns list of countries with available packages
     */
    public function getAvailableCountries(): array
    {
        Cache::forget('esim_available_countries');

        return Cache::remember('esim_available_countries', 3600, function () {
            Log::info('Fetching available eSIM countries');

            // Try to get countries list - API might have a dedicated endpoint
            $result = $this->request('post', '/open/country/list', [
                'pageNum' => 1,
                'pageSize' => 200,
            ]);

            if (!$result['success']) {
                // Fallback: return popular countries from config
                return [
                    'success' => true,
                    'message' => 'Using default country list',
                    'data' => config('esim.popular_countries', []),
                ];
            }

            return $result;
        });
    }

    /**
     * Get packages for a specific country
     */
    public function getPackagesByCountry(string $countryCode): array
    {
        $allPackages = $this->getPackages();

        if (!$allPackages['success']) {
            return $allPackages;
        }

        $filtered = array_filter($allPackages['data'], function ($package) use ($countryCode) {
            return strtoupper($package['countryCode'] ?? '') === strtoupper($countryCode);
        });

        return [
            'success' => true,
            'message' => 'Packages retrieved',
            'data' => array_values($filtered),
        ];
    }

    /**
     * Order a new eSIM profile
     *
     * @param string $packageCode Package code from API (e.g., "US_1_7" = USA, 1GB, 7 days)
     * @param int $quantity Number of eSIMs to order (default: 1)
     * @param string $transactionId Your unique transaction ID
     */
    public function orderESIMProfile(string $packageCode, int $quantity = 1, string $transactionId = null): array
    {
        $transactionId = $transactionId ?? 'TXN_' . time() . '_' . rand(1000, 9999);

        $result = $this->request('post', '/open/esim/order', [
            'packageCode' => $packageCode,
            'qty' => $quantity,
            'transactionId' => $transactionId,
        ]);

        if ($result['success'] && isset($result['data'])) {
            Log::info('eSIM Profile Ordered', [
                'package_code' => $packageCode,
                'order_no' => $result['data']['orderNo'] ?? null,
                'iccid' => $result['data']['iccid'] ?? null,
            ]);
        }

        return $result;
    }

    /**
     * Top-up data on an existing eSIM
     *
     * @param string $iccid The eSIM's ICCID
     * @param string $packageCode Data bundle package code
     * @param string $transactionId Your unique transaction ID
     */
    public function topUpData(string $iccid, string $packageCode, string $transactionId = null): array
    {
        $transactionId = $transactionId ?? 'TOPUP_' . time() . '_' . rand(1000, 9999);

        $result = $this->request('post', '/open/esim/topup', [
            'iccid' => $iccid,
            'packageCode' => $packageCode,
            'transactionId' => $transactionId,
        ]);

        if ($result['success']) {
            Log::info('eSIM Data Topped Up', [
                'iccid' => $iccid,
                'package_code' => $packageCode,
            ]);
        }

        return $result;
    }

    /**
     * Query eSIM details by ICCID
     *
     * @param string $iccid The eSIM's ICCID
     */
    public function queryESIM(string $iccid): array
    {
        return $this->request('post', '/open/esim/query', [
            'iccid' => $iccid,
        ]);
    }

    /**
     * Cancel an eSIM order (get refund)
     *
     * @param string $orderNo Order number from eSIM Access
     */
    public function cancelESIM(string $orderNo): array
    {
        $result = $this->request('post', '/open/esim/cancel', [
            'orderNo' => $orderNo,
        ]);

        if ($result['success']) {
            Log::info('eSIM Order Cancelled', [
                'order_no' => $orderNo,
            ]);
        }

        return $result;
    }

    /**
     * Check data usage for an eSIM
     *
     * @param string $iccid The eSIM's ICCID
     */
    public function checkUsage(string $iccid): array
    {
        return $this->request('post', '/open/esim/usage', [
            'iccid' => $iccid,
        ]);
    }

    /**
     * Get list of supported countries
     * Cached for 24 hours
     */
    public function getCountries(): array
    {
        return Cache::remember('esim_access_countries', 86400, function () {
            $packages = $this->getPackages();

            if (!$packages['success']) {
                return $packages;
            }

            // Extract unique countries
            $countries = [];
            foreach ($packages['data'] as $package) {
                $code = $package['countryCode'] ?? null;
                $name = $package['countryName'] ?? null;

                if ($code && !isset($countries[$code])) {
                    $countries[$code] = [
                        'code' => $code,
                        'name' => $name,
                        'flag' => $this->getCountryFlag($code),
                    ];
                }
            }

            return [
                'success' => true,
                'message' => 'Countries retrieved',
                'data' => array_values($countries),
            ];
        });
    }

    /**
     * Get country flag emoji by country code
     */
    protected function getCountryFlag(string $countryCode): string
    {
        $countryCode = strtoupper($countryCode);

        if (strlen($countryCode) !== 2) {
            return '🌍';
        }

        // Convert country code to flag emoji
        $firstLetter = mb_chr(ord($countryCode[0]) - ord('A') + 0x1F1E6);
        $secondLetter = mb_chr(ord($countryCode[1]) - ord('A') + 0x1F1E6);

        return $firstLetter . $secondLetter;
    }

    /**
     * Clear cached data
     */
    public function clearCache(): void
    {
        Cache::forget('esim_access_packages');
        Cache::forget('esim_access_countries');
        Log::info('eSIM Access cache cleared');
    }

    /**
     * Test API connection
     */
    public function testConnection(): array
    {
        try {
            $result = $this->getBalance();

            return [
                'success' => $result['success'],
                'message' => $result['success']
                    ? 'API connection successful'
                    : 'API connection failed: ' . ($result['message'] ?? 'Unknown error'),
                'data' => $result['data'],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
                'data' => null,
            ];
        }
    }
}
