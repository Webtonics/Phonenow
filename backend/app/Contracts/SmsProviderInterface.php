<?php

namespace App\Contracts;

use App\DTOs\Sms\CountryDto;
use App\DTOs\Sms\ProductDto;
use App\DTOs\Sms\PriceDto;
use App\DTOs\Sms\PurchaseResultDto;
use App\DTOs\Sms\OrderStatusDto;
use App\DTOs\Sms\ProviderBalanceDto;
use Illuminate\Support\Collection;

interface SmsProviderInterface
{
    /**
     * Get the provider identifier (e.g., '5sim', 'grizzlysms')
     */
    public function getIdentifier(): string;

    /**
     * Get the display name for this provider (e.g., '5SIM', 'GrizzlySMS')
     */
    public function getDisplayName(): string;

    /**
     * Check if the provider is currently enabled
     */
    public function isEnabled(): bool;

    /**
     * Get provider account balance
     */
    public function getBalance(): ProviderBalanceDto;

    /**
     * Get available countries
     * @return Collection<int, CountryDto>
     */
    public function getCountries(): Collection;

    /**
     * Get available products/services for a country
     * @return Collection<int, ProductDto>
     */
    public function getProducts(string $country, string $operator = 'any'): Collection;

    /**
     * Get prices for products in a country
     * @return Collection<int, PriceDto>
     */
    public function getPrices(string $country, ?string $product = null): Collection;

    /**
     * Get operator-specific prices for a product
     * @return Collection<int, PriceDto>
     */
    public function getOperatorPrices(string $country, string $product): Collection;

    /**
     * Purchase a phone number
     */
    public function buyNumber(
        string $country,
        string $operator,
        string $product,
        ?int $userId = null
    ): PurchaseResultDto;

    /**
     * Check order status and retrieve SMS
     */
    public function checkOrder(string $providerOrderId, ?int $userId = null): OrderStatusDto;

    /**
     * Finish/complete an order (mark as done)
     */
    public function finishOrder(string $providerOrderId, ?int $userId = null): bool;

    /**
     * Cancel an order
     */
    public function cancelOrder(string $providerOrderId, ?int $userId = null): bool;

    /**
     * Ban/report a bad number
     */
    public function banOrder(string $providerOrderId, ?int $userId = null): bool;

    /**
     * Map provider-specific status to internal status string
     */
    public function mapStatus(string $providerStatus): string;

    /**
     * Get supported service codes mapping
     * Maps internal service names to provider-specific codes
     * @return array<string, string>
     */
    public function getServiceCodeMapping(): array;

    /**
     * Get supported country codes mapping
     * Maps internal country codes to provider-specific codes
     * @return array<string, string>
     */
    public function getCountryCodeMapping(): array;
}
