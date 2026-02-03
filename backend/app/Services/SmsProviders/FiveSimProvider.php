<?php

namespace App\Services\SmsProviders;

use App\Contracts\SmsProviderInterface;
use App\DTOs\Sms\CountryDto;
use App\DTOs\Sms\ProductDto;
use App\DTOs\Sms\PriceDto;
use App\DTOs\Sms\PurchaseResultDto;
use App\DTOs\Sms\OrderStatusDto;
use App\DTOs\Sms\ProviderBalanceDto;
use App\Enums\SmsProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FiveSimProvider extends AbstractSmsProvider implements SmsProviderInterface
{
    public function __construct()
    {
        $this->baseUrl = config('services.fivesim.base_url', 'https://5sim.net/v1');
        $this->apiKey = config('services.fivesim.api_key', '');
        $this->enabled = config('services.fivesim.enabled', true);
    }

    public function getIdentifier(): string
    {
        return SmsProvider::FIVESIM->value;
    }

    public function getDisplayName(): string
    {
        return SmsProvider::FIVESIM->displayName();
    }

    public function getBalance(): ProviderBalanceDto
    {
        $result = $this->makeRequest('GET', '/user/profile');

        if (!$result['success']) {
            return ProviderBalanceDto::failure($result['message'] ?? 'Failed to get balance');
        }

        return ProviderBalanceDto::success(
            $result['data']['balance'] ?? 0,
            'RUB'
        );
    }

    public function getCountries(): Collection
    {
        $result = $this->makeRequest('GET', '/guest/countries');

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        return collect($result['data'])->map(function ($data, $code) {
            // Handle prefix - can be string or array
            $prefix = $data['prefix'] ?? '';
            if (is_array($prefix)) {
                $prefix = $prefix[0] ?? '';
            }

            // Handle iso - can be string or array (e.g., Afghanistan returns array)
            $iso = $data['iso'] ?? null;
            if (is_array($iso)) {
                $iso = $iso[0] ?? null;
            }

            return new CountryDto(
                code: $code,
                name: $data['name'] ?? ucfirst($code),
                prefix: (string) $prefix,
                iso: $iso,
            );
        })->values();
    }

    public function getProducts(string $country, string $operator = 'any'): Collection
    {
        $result = $this->makeRequest('GET', "/guest/products/{$country}/{$operator}");

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        return collect($result['data'])->map(function ($data, $code) {
            return new ProductDto(
                code: $code,
                name: $code,
                quantity: $data['Qty'] ?? 0,
                basePrice: $data['Price'] ?? 0,
                baseCurrency: 'RUB',
                category: $data['Category'] ?? 'other',
            );
        })->values();
    }

    public function getPrices(string $country, ?string $product = null): Collection
    {
        $params = ['country' => $country];
        if ($product) {
            $params['product'] = $product;
        }

        $result = $this->makeRequest('GET', '/guest/prices', $params);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        $prices = collect();
        foreach ($result['data'] as $countryCode => $products) {
            foreach ($products as $productCode => $operators) {
                foreach ($operators as $operatorName => $info) {
                    $prices->push(new PriceDto(
                        operator: $operatorName,
                        cost: $info['cost'] ?? 0,
                        currency: 'RUB',
                        available: $info['count'] ?? 0,
                        successRate: $info['rate'] ?? null,
                        provider: $this->getIdentifier(),
                    ));
                }
            }
        }

        return $prices;
    }

    public function getOperatorPrices(string $country, string $product): Collection
    {
        $result = $this->makeRequest('GET', '/guest/prices', [
            'country' => $country,
            'product' => $product,
        ]);

        if (!$result['success'] || empty($result['data'])) {
            return collect();
        }

        $prices = collect();
        $data = $result['data'];

        if (isset($data[$country][$product])) {
            $operatorData = $data[$country][$product];

            foreach ($operatorData as $operatorName => $info) {
                $prices->push(new PriceDto(
                    operator: $operatorName,
                    cost: $info['cost'] ?? 0,
                    currency: 'RUB',
                    available: $info['count'] ?? 0,
                    successRate: $info['rate'] ?? null,
                    provider: $this->getIdentifier(),
                ));
            }
        }

        return $prices->sortBy('cost')->values();
    }

    public function buyNumber(
        string $country,
        string $operator,
        string $product,
        ?int $userId = null
    ): PurchaseResultDto {
        $endpoint = "/user/buy/activation/{$country}/{$operator}/{$product}";
        $result = $this->makeRequest('GET', $endpoint, [], $userId);

        if (!$result['success']) {
            return PurchaseResultDto::failure(
                $result['message'] ?? 'Failed to purchase number'
            );
        }

        $data = $result['data'];

        return PurchaseResultDto::success([
            'order_id' => $data['id'],
            'phone' => $data['phone'],
            'operator' => $data['operator'],
            'product' => $data['product'],
            'price' => $data['price'],
            'status' => $data['status'],
            'country' => $data['country'],
            'expires' => $data['expires'] ?? null,
        ]);
    }

    public function checkOrder(string $providerOrderId, ?int $userId = null): OrderStatusDto
    {
        $result = $this->makeRequest('GET', "/user/check/{$providerOrderId}", [], $userId);

        if (!$result['success']) {
            return OrderStatusDto::failure($result['message'] ?? 'Failed to check order');
        }

        $data = $result['data'];
        $sms = [];

        if (!empty($data['sms'])) {
            foreach ($data['sms'] as $message) {
                $sms[] = [
                    'code' => $message['code'] ?? null,
                    'text' => $message['text'] ?? '',
                    'sender' => $message['sender'] ?? null,
                    'created_at' => $message['created_at'] ?? null,
                ];
            }
        }

        return OrderStatusDto::success([
            'order_id' => $data['id'],
            'phone' => $data['phone'],
            'status' => $data['status'],
            'sms' => $sms,
        ], $this->mapStatus($data['status']));
    }

    public function finishOrder(string $providerOrderId, ?int $userId = null): bool
    {
        $result = $this->makeRequest('GET', "/user/finish/{$providerOrderId}", [], $userId);
        return $result['success'];
    }

    public function cancelOrder(string $providerOrderId, ?int $userId = null): bool
    {
        $result = $this->makeRequest('GET', "/user/cancel/{$providerOrderId}", [], $userId);
        return $result['success'];
    }

    public function banOrder(string $providerOrderId, ?int $userId = null): bool
    {
        $result = $this->makeRequest('GET', "/user/ban/{$providerOrderId}", [], $userId);
        return $result['success'];
    }

    public function mapStatus(string $providerStatus): string
    {
        return match ($providerStatus) {
            'PENDING' => 'processing',
            'RECEIVED' => 'processing',
            'CANCELED' => 'cancelled',
            'TIMEOUT' => 'expired',
            'FINISHED' => 'completed',
            'BANNED' => 'refunded',
            default => 'processing',
        };
    }

    /**
     * Make HTTP request to 5SIM API
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
            ])->timeout(5)->connectTimeout(3);

            if ($method === 'GET' && !empty($params)) {
                $response = $request->get($url, $params);
            } elseif ($method === 'POST') {
                $response = $request->post($url, $params);
            } else {
                $response = $request->get($url);
            }

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);
            $this->logApiCall($endpoint, $method, $response->status(), $responseTime, $userId);

            $data = $response->json();

            if ($response->successful()) {
                return ['success' => true, 'data' => $data];
            }

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
            $this->logApiCall($endpoint, $method, 500, $responseTime, $userId);

            Log::error('5SIM API exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Service temporarily unavailable',
            ];
        }
    }
}
