<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface SmmProviderInterface
{
    /**
     * Get provider identifier
     */
    public function getIdentifier(): string;

    /**
     * Get provider display name
     */
    public function getDisplayName(): string;

    /**
     * Check if provider is enabled
     */
    public function isEnabled(): bool;

    /**
     * Get provider balance
     */
    public function getBalance(): array;

    /**
     * Get all available services from provider
     * Returns Collection of service arrays
     */
    public function getServices(): Collection;

    /**
     * Create a new order
     *
     * @param string $serviceId Provider's service ID
     * @param string $link Social media link (profile URL, post URL, etc.)
     * @param int $quantity Number of followers/likes/views
     * @return array ['success' => bool, 'order_id' => string|null, 'message' => string]
     */
    public function createOrder(string $serviceId, string $link, int $quantity): array;

    /**
     * Get order status
     *
     * @param string $orderId Provider's order ID
     * @return array ['success' => bool, 'status' => string, 'remains' => int|null, 'start_count' => int|null]
     */
    public function getOrderStatus(string $orderId): array;

    /**
     * Get multiple order statuses
     *
     * @param array $orderIds Array of provider order IDs
     * @return array ['success' => bool, 'orders' => array]
     */
    public function getMultipleOrderStatus(array $orderIds): array;

    /**
     * Cancel an order
     *
     * @param string $orderId Provider's order ID
     * @return array ['success' => bool, 'message' => string]
     */
    public function cancelOrder(string $orderId): array;

    /**
     * Request refill for an order
     *
     * @param string $orderId Provider's order ID
     * @return array ['success' => bool, 'message' => string]
     */
    public function requestRefill(string $orderId): array;
}
