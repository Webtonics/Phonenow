<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ZenditService
{
    protected string $apiUrl;
    protected string $apiKey;
    protected int $timeout;
    protected int $syncTimeout;
    protected int $retryTimes;
    protected int $retrySleep;
    protected int $chunkSize;

    // Zendit transaction statuses
    public const STATUS_DONE = 'DONE';
    public const STATUS_FAILED = 'FAILED';
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_ACCEPTED = 'ACCEPTED';
    public const STATUS_AUTHORIZED = 'AUTHORIZED';
    public const STATUS_IN_PROGRESS = 'IN_PROGRESS';

    // Internal status mapping
    public const STATUS_MAP = [
        'DONE' => 'active',
        'FAILED' => 'failed',
        'PENDING' => 'pending',
        'ACCEPTED' => 'pending',
        'AUTHORIZED' => 'pending',
        'IN_PROGRESS' => 'processing',
    ];

    public function __construct()
    {
        $this->apiUrl = config('esim.api_url', 'https://api.zendit.io/v1');
        $this->apiKey = config('esim.api_key');
        $this->timeout = config('esim.timeout', 30);
        $this->syncTimeout = config('esim.sync_timeout', 120);
        $this->retryTimes = config('esim.retry_times', 3);
        $this->retrySleep = config('esim.retry_sleep', 2000);
        $this->chunkSize = config('esim.chunk_size', 50); // Smaller chunks for reliability
    }

    /**
     * Make authenticated API request to Zendit with retry logic
     */
    protected function request(string $method, string $endpoint, array $data = [], array $query = [], int $customTimeout = null): array
    {
        $url = $this->apiUrl . $endpoint;
        $timeout = $customTimeout ?? $this->timeout;
        $lastError = null;

        for ($attempt = 1; $attempt <= $this->retryTimes; $attempt++) {
            try {
                Log::info('Zendit API Request', [
                    'method' => $method,
                    'endpoint' => $endpoint,
                    'attempt' => $attempt,
                    'timeout' => $timeout,
                ]);

                $httpClient = Http::timeout($timeout)
                    ->connectTimeout(15)
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json',
                    ]);

                if (!empty($query)) {
                    $httpClient = $httpClient->withQueryParameters($query);
                }

                $response = match (strtolower($method)) {
                    'get' => $httpClient->get($url),
                    'post' => $httpClient->post($url, $data),
                    'put' => $httpClient->put($url, $data),
                    'delete' => $httpClient->delete($url),
                    default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
                };

                $result = $response->json();

                if ($response->successful()) {
                    Log::info('Zendit API Success', [
                        'endpoint' => $endpoint,
                        'status' => $response->status(),
                    ]);

                    return [
                        'success' => true,
                        'message' => 'Success',
                        'data' => $result,
                    ];
                }

                Log::error('Zendit API Error', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'response' => $result,
                ]);

                // Don't retry client errors (4xx), only server errors (5xx)
                if ($response->status() < 500) {
                    return [
                        'success' => false,
                        'message' => $result['message'] ?? $result['error'] ?? 'API request failed',
                        'error_code' => $result['code'] ?? null,
                        'data' => null,
                    ];
                }

                $lastError = $result['message'] ?? 'Server error';

            } catch (\Exception $e) {
                $lastError = $e->getMessage();
                Log::warning('Zendit API Attempt Failed', [
                    'endpoint' => $endpoint,
                    'attempt' => $attempt,
                    'error' => $lastError,
                ]);
            }

            // Wait before retry (exponential backoff)
            if ($attempt < $this->retryTimes) {
                $sleepMs = $this->retrySleep * $attempt;
                usleep($sleepMs * 1000);
            }
        }

        Log::error('Zendit API All Retries Failed', [
            'endpoint' => $endpoint,
            'attempts' => $this->retryTimes,
            'lastError' => $lastError,
        ]);

        return [
            'success' => false,
            'message' => 'API connection error after ' . $this->retryTimes . ' attempts: ' . $lastError,
            'data' => null,
        ];
    }

    // =========================================================================
    // ACCOUNT ENDPOINTS
    // =========================================================================

    /**
     * Get account balance
     * Zendit returns: { "availableBalance": 1000.00, "currencyCode": "USD" }
     * We normalize to: { "balance": 1000.00, "currency": "USD" }
     */
    public function getBalance(): array
    {
        $result = $this->request('get', '/balance');

        // Debug log raw response
        Log::info('Zendit Balance Response', [
            'success' => $result['success'],
            'raw_data' => $result['data'] ?? null,
            'message' => $result['message'] ?? null,
        ]);

        if ($result['success'] && isset($result['data'])) {
            // Normalize Zendit response format
            $result['data'] = [
                'balance' => $result['data']['availableBalance'] ?? $result['data']['balance'] ?? 0,
                'currency' => $result['data']['currencyCode'] ?? $result['data']['currency'] ?? 'USD',
            ];
        }

        return $result;
    }

    // =========================================================================
    // ESIM OFFERS ENDPOINTS
    // =========================================================================

    /**
     * Get eSIM offers with pagination
     */
    public function getOffers(int $limit = 50, int $offset = 0, ?string $country = null, ?string $region = null): array
    {
        $query = [
            '_limit' => min(max($limit, 1), 500), // Cap at 500 for reliability
            '_offset' => max($offset, 0),
        ];

        if ($country) {
            $query['country'] = strtoupper($country);
        }

        if ($region) {
            $query['region'] = $region;
        }

        // Use longer timeout for offers fetch
        return $this->request('get', '/esim/offers', [], $query, 60);
    }

    /**
     * Get all offers with chunked pagination and progress callback
     * This method fetches in smaller chunks to avoid timeouts
     */
    public function getAllOffersChunked(?callable $progressCallback = null): array
    {
        $cacheKey = 'zendit_all_offers';

        // Try cache first
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return [
                'success' => true,
                'message' => 'Retrieved from cache',
                'data' => ['list' => $cached, 'total' => count($cached)],
                'from_cache' => true,
            ];
        }

        $allOffers = [];
        $offset = 0;
        $limit = $this->chunkSize;
        $totalExpected = null;
        $retryCount = 0;
        $maxChunkRetries = 2;

        Log::info('Starting chunked offers fetch', ['chunk_size' => $limit]);

        while (true) {
            $result = $this->getOffers($limit, $offset);

            if (!$result['success']) {
                $retryCount++;

                if ($retryCount <= $maxChunkRetries) {
                    Log::warning('Chunk fetch failed, retrying', [
                        'offset' => $offset,
                        'retry' => $retryCount,
                    ]);
                    sleep(2);
                    continue;
                }

                // If we already have some offers, return what we have
                if (!empty($allOffers)) {
                    Log::warning('Returning partial offers after failures', [
                        'fetched' => count($allOffers),
                    ]);
                    break;
                }

                return $result;
            }

            $retryCount = 0; // Reset retry count on success
            $data = $result['data'];
            $offers = $data['list'] ?? [];

            if (empty($offers)) {
                break;
            }

            $allOffers = array_merge($allOffers, $offers);

            // Get total from first response
            if ($totalExpected === null) {
                $totalExpected = $data['total'] ?? count($offers);
            }

            $progress = [
                'fetched' => count($allOffers),
                'total' => $totalExpected,
                'percentage' => $totalExpected > 0 ? round((count($allOffers) / $totalExpected) * 100, 1) : 0,
            ];

            Log::info('Offers fetch progress', $progress);

            if ($progressCallback) {
                $progressCallback($progress);
            }

            // Check if we've fetched all
            $offset += count($offers);

            if (count($offers) < $limit || $offset >= $totalExpected) {
                break;
            }

            // Small delay between chunks to be gentle on the API
            usleep(500000); // 0.5 second
        }

        // Cache the results for 1 hour
        if (!empty($allOffers)) {
            Cache::put($cacheKey, $allOffers, 3600);
        }

        return [
            'success' => true,
            'message' => 'Fetched ' . count($allOffers) . ' offers',
            'data' => [
                'list' => $allOffers,
                'total' => count($allOffers),
            ],
        ];
    }

    /**
     * Get all offers (legacy method - uses chunked internally)
     */
    public function getAllOffers(?string $country = null, ?string $region = null): array
    {
        // If country/region specified, do a direct filtered fetch
        if ($country || $region) {
            $cacheKey = 'zendit_offers_' . ($country ?? 'all') . '_' . ($region ?? 'all');

            return Cache::remember($cacheKey, 3600, function () use ($country, $region) {
                $result = $this->getOffers(500, 0, $country, $region);

                if (!$result['success']) {
                    return $result;
                }

                return [
                    'success' => true,
                    'message' => 'Offers retrieved',
                    'data' => [
                        'list' => $result['data']['list'] ?? [],
                        'total' => $result['data']['total'] ?? 0,
                    ],
                ];
            });
        }

        // For all offers, use chunked fetch
        return $this->getAllOffersChunked();
    }

    /**
     * Get specific eSIM offer details
     */
    public function getOffer(string $offerId): array
    {
        return $this->request('get', "/esim/offers/{$offerId}");
    }

    /**
     * Get offers by country code
     */
    public function getOffersByCountry(string $countryCode): array
    {
        return $this->getOffers(500, 0, $countryCode);
    }

    // =========================================================================
    // ESIM PURCHASE ENDPOINTS
    // =========================================================================

    /**
     * Create eSIM purchase transaction
     */
    public function purchaseEsim(string $transactionId, string $offerId, ?string $recipientPhone = null): array
    {
        $data = [
            'transactionId' => $transactionId,
            'offerId' => $offerId,
        ];

        if ($recipientPhone) {
            $data['recipientPhoneNumber'] = $recipientPhone;
        }

        Log::info('Zendit eSIM Purchase Request', [
            'transactionId' => $transactionId,
            'offerId' => $offerId,
        ]);

        $result = $this->request('post', '/esim/purchases', $data, [], 60);

        if ($result['success']) {
            Log::info('Zendit eSIM Purchase Success', [
                'transactionId' => $transactionId,
                'status' => $result['data']['status'] ?? 'unknown',
            ]);
        }

        return $result;
    }

    /**
     * List eSIM purchase transactions
     */
    public function getPurchases(int $limit = 100, int $offset = 0, ?string $createdAtGte = null, ?string $createdAtLte = null): array
    {
        $query = [
            '_limit' => min(max($limit, 1), 1024),
            '_offset' => max($offset, 0),
        ];

        if ($createdAtGte) {
            $query['createdAt'] = 'gte' . $createdAtGte;
        }

        if ($createdAtLte) {
            $query['createdAt'] = 'lte' . $createdAtLte;
        }

        return $this->request('get', '/esim/purchases', [], $query);
    }

    /**
     * Get specific eSIM purchase transaction details
     */
    public function getPurchase(string $transactionId): array
    {
        return $this->request('get', "/esim/purchases/{$transactionId}");
    }

    /**
     * Get QR code for eSIM activation
     */
    public function getQrCode(string $transactionId): array
    {
        return $this->request('get', "/esim/purchases/{$transactionId}/qrcode");
    }

    /**
     * Get eSIM usage statistics
     */
    public function getUsage(string $transactionId): array
    {
        return $this->request('get', "/esim/purchases/{$transactionId}/usage");
    }

    /**
     * Initiate refund for eSIM purchase
     */
    public function requestRefund(string $transactionId): array
    {
        Log::info('Zendit Refund Request', ['transactionId' => $transactionId]);

        $result = $this->request('post', "/esim/purchases/{$transactionId}/refund");

        if ($result['success']) {
            Log::info('Zendit Refund Initiated', ['transactionId' => $transactionId]);
        }

        return $result;
    }

    /**
     * Check refund status
     */
    public function getRefundStatus(string $transactionId): array
    {
        return $this->request('get', "/esim/purchases/{$transactionId}/refund");
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Map Zendit status to internal status
     */
    public function mapStatus(string $zenditStatus): string
    {
        return self::STATUS_MAP[$zenditStatus] ?? 'pending';
    }

    /**
     * Check if transaction is complete
     */
    public function isComplete(string $status): bool
    {
        return $status === self::STATUS_DONE;
    }

    /**
     * Check if transaction failed
     */
    public function isFailed(string $status): bool
    {
        return $status === self::STATUS_FAILED;
    }

    /**
     * Check if transaction is still processing
     */
    public function isProcessing(string $status): bool
    {
        return in_array($status, [
            self::STATUS_PENDING,
            self::STATUS_ACCEPTED,
            self::STATUS_AUTHORIZED,
            self::STATUS_IN_PROGRESS,
        ]);
    }

    /**
     * Convert GB to MB
     */
    public function gbToMb(float $gb): float
    {
        return $gb * 1024;
    }

    /**
     * Convert MB to GB
     */
    public function mbToGb(float $mb): float
    {
        return $mb / 1024;
    }

    /**
     * Format data amount for display
     */
    public function formatData(?float $dataGb, bool $unlimited = false): string
    {
        if ($unlimited) {
            return 'Unlimited';
        }

        if ($dataGb === null) {
            return 'N/A';
        }

        if ($dataGb >= 1) {
            return round($dataGb, 1) . ' GB';
        }

        return round($dataGb * 1024) . ' MB';
    }

    /**
     * Get country flag emoji from country code
     */
    public function getCountryFlag(string $countryCode): string
    {
        $countryCode = strtoupper($countryCode);

        if (strlen($countryCode) !== 2) {
            return '🌍';
        }

        $firstLetter = mb_chr(ord($countryCode[0]) - ord('A') + 0x1F1E6);
        $secondLetter = mb_chr(ord($countryCode[1]) - ord('A') + 0x1F1E6);

        return $firstLetter . $secondLetter;
    }

    /**
     * Extract unique countries from offers
     */
    public function extractCountries(array $offers): array
    {
        $countries = [];

        foreach ($offers as $offer) {
            $code = $offer['country'] ?? null;

            if ($code && !isset($countries[$code])) {
                $countries[$code] = [
                    'code' => $code,
                    'name' => $this->getCountryName($code),
                    'flag' => $this->getCountryFlag($code),
                ];
            }
        }

        uasort($countries, fn($a, $b) => strcmp($a['name'], $b['name']));

        return array_values($countries);
    }

    /**
     * Get country name from code
     */
    public function getCountryName(string $code): string
    {
        $countries = [
            'US' => 'United States',
            'GB' => 'United Kingdom',
            'CA' => 'Canada',
            'AU' => 'Australia',
            'DE' => 'Germany',
            'FR' => 'France',
            'ES' => 'Spain',
            'IT' => 'Italy',
            'JP' => 'Japan',
            'KR' => 'South Korea',
            'CN' => 'China',
            'HK' => 'Hong Kong',
            'SG' => 'Singapore',
            'TH' => 'Thailand',
            'MY' => 'Malaysia',
            'ID' => 'Indonesia',
            'PH' => 'Philippines',
            'VN' => 'Vietnam',
            'IN' => 'India',
            'AE' => 'United Arab Emirates',
            'SA' => 'Saudi Arabia',
            'TR' => 'Turkey',
            'EG' => 'Egypt',
            'ZA' => 'South Africa',
            'NG' => 'Nigeria',
            'KE' => 'Kenya',
            'GH' => 'Ghana',
            'BR' => 'Brazil',
            'MX' => 'Mexico',
            'AR' => 'Argentina',
            'CL' => 'Chile',
            'CO' => 'Colombia',
            'PE' => 'Peru',
            'NZ' => 'New Zealand',
            'NL' => 'Netherlands',
            'BE' => 'Belgium',
            'CH' => 'Switzerland',
            'AT' => 'Austria',
            'SE' => 'Sweden',
            'NO' => 'Norway',
            'DK' => 'Denmark',
            'FI' => 'Finland',
            'PL' => 'Poland',
            'CZ' => 'Czech Republic',
            'PT' => 'Portugal',
            'GR' => 'Greece',
            'IE' => 'Ireland',
            'RU' => 'Russia',
            'UA' => 'Ukraine',
            'IL' => 'Israel',
            'TW' => 'Taiwan',
        ];

        return $countries[strtoupper($code)] ?? $code;
    }

    /**
     * Clear cached data
     */
    public function clearCache(): void
    {
        Cache::forget('zendit_all_offers');
        Cache::forget('zendit_offers_all_all');

        // Clear country/region specific caches
        $patterns = ['zendit_offers_'];
        foreach ($patterns as $pattern) {
            // Note: This is a simple implementation.
            // For production, consider using cache tags
        }

        Log::info('Zendit cache cleared');
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

    /**
     * Generate unique transaction ID for purchases
     */
    public function generateTransactionId(int $userId, string $prefix = 'ESIM'): string
    {
        return sprintf(
            '%s_%d_%d_%s',
            $prefix,
            $userId,
            time(),
            substr(md5(uniqid()), 0, 8)
        );
    }
}
