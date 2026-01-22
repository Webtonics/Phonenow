<?php

namespace App\Services;

use App\Models\ApiLog;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FiveSimService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.fivesim.base_url');
        $this->apiKey = config('services.fivesim.api_key');
    }

    /**
     * Get user profile and balance from 5SIM
     */
    public function getProfile(): array
    {
        return $this->makeRequest('GET', '/user/profile');
    }

    /**
     * Get available countries
     */
    public function getCountries(): array
    {
        return $this->makeRequest('GET', '/guest/countries');
    }

    /**
     * Get available products (services) for a country
     */
    public function getProducts(string $country, string $operator = 'any'): array
    {
        return $this->makeRequest('GET', "/guest/products/{$country}/{$operator}");
    }

    /**
     * Get prices for all products in a country
     */
    public function getPrices(string $country = 'nigeria', string $product = ''): array
    {
        $endpoint = "/guest/prices";
        $params = ['country' => $country];

        if ($product) {
            $params['product'] = $product;
        }

        return $this->makeRequest('GET', $endpoint, $params);
    }

    /**
     * Purchase a phone number
     */
    public function buyNumber(
        string $country,
        string $operator,
        string $product,
        ?int $userId = null
    ): array {
        $endpoint = "/user/buy/activation/{$country}/{$operator}/{$product}";

        $result = $this->makeRequest('GET', $endpoint, [], $userId);

        if ($result['success'] && isset($result['data'])) {
            return [
                'success' => true,
                'data' => [
                    'order_id' => $result['data']['id'],
                    'phone' => $result['data']['phone'],
                    'operator' => $result['data']['operator'],
                    'product' => $result['data']['product'],
                    'price' => $result['data']['price'],
                    'status' => $result['data']['status'],
                    'expires' => $result['data']['expires'] ?? null,
                    'country' => $result['data']['country'],
                ],
            ];
        }

        return $result;
    }

    /**
     * Check order status and get SMS
     */
    public function checkOrder(string $orderId, ?int $userId = null): array
    {
        $endpoint = "/user/check/{$orderId}";

        $result = $this->makeRequest('GET', $endpoint, [], $userId);

        if ($result['success'] && isset($result['data'])) {
            $sms = [];
            if (!empty($result['data']['sms'])) {
                foreach ($result['data']['sms'] as $message) {
                    $sms[] = [
                        'created_at' => $message['created_at'],
                        'date' => $message['date'],
                        'sender' => $message['sender'],
                        'text' => $message['text'],
                        'code' => $message['code'],
                    ];
                }
            }

            return [
                'success' => true,
                'data' => [
                    'order_id' => $result['data']['id'],
                    'phone' => $result['data']['phone'],
                    'operator' => $result['data']['operator'],
                    'product' => $result['data']['product'],
                    'price' => $result['data']['price'],
                    'status' => $result['data']['status'],
                    'expires' => $result['data']['expires'] ?? null,
                    'country' => $result['data']['country'],
                    'sms' => $sms,
                ],
            ];
        }

        return $result;
    }

    /**
     * Finish order (mark as done)
     */
    public function finishOrder(string $orderId, ?int $userId = null): array
    {
        $endpoint = "/user/finish/{$orderId}";

        return $this->makeRequest('GET', $endpoint, [], $userId);
    }

    /**
     * Cancel order
     */
    public function cancelOrder(string $orderId, ?int $userId = null): array
    {
        $endpoint = "/user/cancel/{$orderId}";

        return $this->makeRequest('GET', $endpoint, [], $userId);
    }

    /**
     * Ban order (report bad number)
     */
    public function banOrder(string $orderId, ?int $userId = null): array
    {
        $endpoint = "/user/ban/{$orderId}";

        return $this->makeRequest('GET', $endpoint, [], $userId);
    }

    /**
     * Get SMS inbox for an order
     */
    public function getSmsInbox(string $orderId, ?int $userId = null): array
    {
        $endpoint = "/user/sms/inbox/{$orderId}";

        return $this->makeRequest('GET', $endpoint, [], $userId);
    }

    /**
     * Make API request to 5SIM
     */
    protected function makeRequest(
        string $method,
        string $endpoint,
        array $params = [],
        ?int $userId = null
    ): array {
        $startTime = microtime(true);
        $url = $this->baseUrl . $endpoint;

        try {
            $request = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Accept' => 'application/json',
            ]);

            if ($method === 'GET' && !empty($params)) {
                $response = $request->get($url, $params);
            } elseif ($method === 'POST') {
                $response = $request->post($url, $params);
            } else {
                $response = $request->get($url);
            }

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                $endpoint,
                $method,
                $response->status(),
                $responseTime,
                $userId
            );

            $data = $response->json();

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $data,
                ];
            }

            // Handle error responses
            $errorMessage = 'API request failed';
            if (is_array($data) && isset($data['message'])) {
                $errorMessage = $data['message'];
            } elseif (is_string($data)) {
                $errorMessage = $data;
            }

            Log::warning('5SIM API error', [
                'endpoint' => $endpoint,
                'status' => $response->status(),
                'response' => $data,
            ]);

            return [
                'success' => false,
                'message' => $errorMessage,
                'status_code' => $response->status(),
            ];
        } catch (\Exception $e) {
            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            $this->logApiCall(
                $endpoint,
                $method,
                500,
                $responseTime,
                $userId
            );

            Log::error('5SIM API exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while communicating with the service',
            ];
        }
    }

    /**
     * Log API call for monitoring
     */
    protected function logApiCall(
        string $endpoint,
        string $method,
        int $statusCode,
        int $responseTime,
        ?int $userId = null
    ): void {
        ApiLog::create([
            'user_id' => $userId,
            'endpoint' => '5sim:' . $endpoint,
            'method' => $method,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }

    /**
     * Convert 5SIM status to our internal status
     */
    public static function mapStatus(string $fiveSimStatus): string
    {
        return match ($fiveSimStatus) {
            'PENDING' => 'pending',
            'RECEIVED' => 'active',
            'CANCELED' => 'cancelled',
            'TIMEOUT' => 'expired',
            'FINISHED' => 'completed',
            'BANNED' => 'refunded',
            default => 'pending',
        };
    }
}
