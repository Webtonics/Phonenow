<?php

namespace App\Services\SmmProviders;

use App\Contracts\SmmProviderInterface;
use Illuminate\Support\Collection;

class JapProvider extends AbstractSmmProvider implements SmmProviderInterface
{
    public function __construct()
    {
        $this->baseUrl = config('services.jap.base_url', 'https://justanotherpanel.com/api/v2');
        $this->apiKey = config('services.jap.api_key', '');
        $this->enabled = config('services.jap.enabled', false);
    }

    public function getIdentifier(): string
    {
        return 'jap';
    }

    public function getDisplayName(): string
    {
        return 'JustAnotherPanel';
    }

    public function isEnabled(): bool
    {
        return $this->enabled && $this->isConfigured();
    }

    public function getBalance(): array
    {
        $result = $this->makeRequest([
            'action' => 'balance',
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'balance' => 0,
                'currency' => 'USD',
                'message' => $result['message'],
            ];
        }

        return [
            'success' => true,
            'balance' => (float) ($result['data']['balance'] ?? 0),
            'currency' => $result['data']['currency'] ?? 'USD',
            'message' => 'Balance retrieved successfully',
        ];
    }

    public function getServices(): Collection
    {
        $result = $this->makeRequest([
            'action' => 'services',
        ]);

        if (!$result['success']) {
            return collect();
        }

        $services = collect($result['data']);

        return $services->map(function ($service) {
            return [
                'provider_service_id' => (string) $service['service'],
                'name' => $service['name'],
                'type' => $this->extractServiceType($service['name']),
                'category' => $service['category'] ?? 'Unknown',
                'rate' => (float) $service['rate'], // Cost per 1000
                'min' => (int) $service['min'],
                'max' => (int) $service['max'],
                'refill' => (bool) ($service['refill'] ?? false),
                'cancel' => (bool) ($service['cancel'] ?? false),
                'description' => $service['description'] ?? '',
            ];
        });
    }

    public function createOrder(string $serviceId, string $link, int $quantity): array
    {
        $result = $this->makeRequest([
            'action' => 'add',
            'service' => $serviceId,
            'link' => $link,
            'quantity' => $quantity,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'order_id' => null,
                'message' => $result['message'],
            ];
        }

        return [
            'success' => true,
            'order_id' => (string) $result['data']['order'],
            'message' => 'Order created successfully',
        ];
    }

    public function getOrderStatus(string $orderId): array
    {
        $result = $this->makeRequest([
            'action' => 'status',
            'order' => $orderId,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'status' => 'unknown',
                'remains' => null,
                'start_count' => null,
                'message' => $result['message'],
            ];
        }

        $data = $result['data'];

        return [
            'success' => true,
            'status' => $this->mapStatus($data['status'] ?? ''),
            'charge' => (float) ($data['charge'] ?? 0),
            'start_count' => isset($data['start_count']) ? (int) $data['start_count'] : null,
            'remains' => isset($data['remains']) ? (int) $data['remains'] : null,
            'currency' => $data['currency'] ?? 'USD',
            'message' => 'Status retrieved successfully',
        ];
    }

    public function getMultipleOrderStatus(array $orderIds): array
    {
        $result = $this->makeRequest([
            'action' => 'status',
            'orders' => implode(',', $orderIds),
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'orders' => [],
                'message' => $result['message'],
            ];
        }

        $orders = [];
        foreach ($result['data'] as $orderId => $orderData) {
            $orders[$orderId] = [
                'status' => $this->mapStatus($orderData['status'] ?? ''),
                'charge' => (float) ($orderData['charge'] ?? 0),
                'start_count' => isset($orderData['start_count']) ? (int) $orderData['start_count'] : null,
                'remains' => isset($orderData['remains']) ? (int) $orderData['remains'] : null,
            ];
        }

        return [
            'success' => true,
            'orders' => $orders,
            'message' => 'Statuses retrieved successfully',
        ];
    }

    public function cancelOrder(string $orderId): array
    {
        $result = $this->makeRequest([
            'action' => 'cancel',
            'order' => $orderId,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
            ];
        }

        return [
            'success' => true,
            'message' => 'Order cancelled successfully',
        ];
    }

    public function requestRefill(string $orderId): array
    {
        $result = $this->makeRequest([
            'action' => 'refill',
            'order' => $orderId,
        ]);

        if (!$result['success']) {
            return [
                'success' => false,
                'message' => $result['message'],
            ];
        }

        return [
            'success' => true,
            'refill_id' => $result['data']['refill'] ?? null,
            'message' => 'Refill requested successfully',
        ];
    }

    /**
     * Map provider status to our internal status
     */
    protected function mapStatus(string $providerStatus): string
    {
        return match (strtolower($providerStatus)) {
            'pending' => 'processing',
            'in progress', 'processing' => 'in_progress',
            'completed' => 'completed',
            'partial' => 'partial',
            'canceled', 'cancelled' => 'cancelled',
            default => 'processing',
        };
    }

    /**
     * Extract service type from name
     */
    protected function extractServiceType(string $name): string
    {
        $name = strtolower($name);

        if (str_contains($name, 'followers') || str_contains($name, 'subscriber')) {
            return 'followers';
        }
        if (str_contains($name, 'likes')) {
            return 'likes';
        }
        if (str_contains($name, 'views')) {
            return 'views';
        }
        if (str_contains($name, 'comments')) {
            return 'comments';
        }
        if (str_contains($name, 'shares')) {
            return 'shares';
        }

        return 'other';
    }
}
