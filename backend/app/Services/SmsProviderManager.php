<?php

namespace App\Services;

use App\Contracts\SmsProviderInterface;
use App\DTOs\Sms\PriceDto;
use App\Enums\SmsProvider;
use App\Models\Order;
use App\Services\SmsProviders\FiveSimProvider;
use App\Services\SmsProviders\GrizzlySmsProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SmsProviderManager
{
    protected array $providers = [];
    protected ?string $defaultProvider = null;

    public function __construct()
    {
        $this->registerProviders();
        $this->defaultProvider = config('sms.default_provider', SmsProvider::FIVESIM->value);
    }

    /**
     * Register all available providers
     */
    protected function registerProviders(): void
    {
        $this->providers = [
            SmsProvider::FIVESIM->value => fn() => app(FiveSimProvider::class),
            SmsProvider::GRIZZLYSMS->value => fn() => app(GrizzlySmsProvider::class),
        ];
    }

    /**
     * Get a specific provider instance by name
     *
     * @throws \InvalidArgumentException
     */
    public function provider(?string $name = null): SmsProviderInterface
    {
        $name = $name ?? $this->defaultProvider;

        if (!isset($this->providers[$name])) {
            throw new \InvalidArgumentException("SMS provider [{$name}] not supported.");
        }

        return call_user_func($this->providers[$name]);
    }

    /**
     * Get the default provider
     */
    public function getDefault(): SmsProviderInterface
    {
        return $this->provider($this->defaultProvider);
    }

    /**
     * Get the default provider name
     */
    public function getDefaultName(): string
    {
        return $this->defaultProvider;
    }

    /**
     * Get all registered provider names
     */
    public function getRegisteredProviders(): array
    {
        return array_keys($this->providers);
    }

    /**
     * Get all enabled providers
     * @return Collection<int, SmsProviderInterface>
     */
    public function getEnabledProviders(): Collection
    {
        return collect($this->providers)
            ->map(fn($factory) => call_user_func($factory))
            ->filter(fn(SmsProviderInterface $provider) => $provider->isEnabled());
    }

    /**
     * Check if a provider is registered
     */
    public function hasProvider(string $name): bool
    {
        return isset($this->providers[$name]);
    }

    /**
     * Get provider by order record
     */
    public function getProviderForOrder(Order $order): SmsProviderInterface
    {
        return $this->provider($order->provider);
    }

    /**
     * Select best provider for a purchase based on criteria
     *
     * @param string $strategy One of: 'cheapest', 'most_available', 'highest_success', 'default'
     */
    public function selectBestProvider(
        string $country,
        string $product,
        string $strategy = 'cheapest'
    ): ?SmsProviderInterface {
        if ($strategy === 'default') {
            $default = $this->getDefault();
            return $default->isEnabled() ? $default : null;
        }

        $availableProviders = $this->getEnabledProviders()
            ->filter(function (SmsProviderInterface $provider) use ($country, $product) {
                try {
                    $prices = $provider->getOperatorPrices($country, $product);
                    return $prices->isNotEmpty() && $prices->sum('available') > 0;
                } catch (\Exception $e) {
                    Log::warning('Failed to check provider availability', [
                        'provider' => $provider->getIdentifier(),
                        'country' => $country,
                        'product' => $product,
                        'error' => $e->getMessage(),
                    ]);
                    return false;
                }
            });

        if ($availableProviders->isEmpty()) {
            return null;
        }

        return match ($strategy) {
            'cheapest' => $this->selectCheapest($availableProviders, $country, $product),
            'most_available' => $this->selectMostAvailable($availableProviders, $country, $product),
            'highest_success' => $this->selectHighestSuccess($availableProviders, $country, $product),
            default => $availableProviders->first(),
        };
    }

    /**
     * Get aggregated prices from ALL enabled providers
     * This fetches from all providers to show multiple price options (Cheapest/Premium)
     * IMPORTANT: Does NOT cache empty results to prevent caching failures
     * @return Collection<int, PriceDto>
     */
    public function getAggregatedPrices(string $country, string $product): Collection
    {
        $cacheKey = "sms_aggregated_prices_{$country}_{$product}";
        $cacheTtl = config('sms.cache.prices', 300);

        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached !== null && $cached->isNotEmpty()) {
            return $cached;
        }

        // Fetch from ALL enabled providers to get multiple price points
        $prices = $this->getEnabledProviders()
            ->flatMap(function (SmsProviderInterface $provider) use ($country, $product) {
                try {
                    return $provider->getOperatorPrices($country, $product)
                        ->map(function (PriceDto $price) use ($provider) {
                            return new PriceDto(
                                operator: $price->operator . '_' . $provider->getIdentifier(),
                                cost: $price->cost,
                                currency: $price->currency,
                                available: $price->available,
                                successRate: $price->successRate,
                                provider: $provider->getIdentifier(),
                            );
                        });
                } catch (\Exception $e) {
                    Log::warning('Failed to get prices from provider', [
                        'provider' => $provider->getIdentifier(),
                        'country' => $country,
                        'product' => $product,
                        'error' => $e->getMessage(),
                    ]);
                    return collect();
                }
            })
            ->sortBy('cost')
            ->values();

        // Only cache non-empty results
        if ($prices->isNotEmpty()) {
            Cache::put($cacheKey, $prices, $cacheTtl);
        }

        return $prices;
    }

    /**
     * Get aggregated countries from all providers
     * Optimized: Uses default provider first, falls back to others if needed
     * IMPORTANT: Does NOT cache empty results to prevent caching failures
     */
    public function getAggregatedCountries(): Collection
    {
        $cacheKey = 'sms_aggregated_countries';
        $cacheTtl = config('sms.cache.countries', 3600);

        // Check cache first
        $cached = Cache::get($cacheKey);
        if ($cached !== null && $cached->isNotEmpty()) {
            return $cached;
        }

        // Try default provider first for faster response
        try {
            $defaultProvider = $this->getDefault();
            if ($defaultProvider->isEnabled()) {
                $countries = $defaultProvider->getCountries();
                if ($countries->isNotEmpty()) {
                    $result = $countries->sortBy('name')->values();
                    Cache::put($cacheKey, $result, $cacheTtl);
                    return $result;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Default provider failed for countries', [
                'provider' => $this->defaultProvider,
                'error' => $e->getMessage(),
            ]);
        }

        // Fallback: try other providers
        $countries = $this->getEnabledProviders()
            ->flatMap(function (SmsProviderInterface $provider) {
                try {
                    return $provider->getCountries();
                } catch (\Exception $e) {
                    Log::warning('Failed to get countries from provider', [
                        'provider' => $provider->getIdentifier(),
                        'error' => $e->getMessage(),
                    ]);
                    return collect();
                }
            })
            ->unique('code')
            ->sortBy('name')
            ->values();

        // Only cache non-empty results
        if ($countries->isNotEmpty()) {
            Cache::put($cacheKey, $countries, $cacheTtl);
        }

        return $countries;
    }

    /**
     * Get all available providers info for API response
     */
    public function getProvidersInfo(): Collection
    {
        return collect($this->providers)->map(function ($factory, $name) {
            try {
                $provider = call_user_func($factory);
                $balance = null;

                // Only fetch balance if provider is enabled
                if ($provider->isEnabled()) {
                    try {
                        $balanceResult = $provider->getBalance();
                        $balance = $balanceResult->success ? [
                            'amount' => $balanceResult->balance,
                            'currency' => $balanceResult->currency,
                        ] : null;
                    } catch (\Exception $e) {
                        // Balance fetch failed, leave as null
                    }
                }

                return [
                    'id' => $provider->getIdentifier(),
                    'name' => $provider->getDisplayName(),
                    'enabled' => $provider->isEnabled(),
                    'is_default' => $name === $this->defaultProvider,
                    'balance' => $balance,
                ];
            } catch (\Exception $e) {
                return [
                    'id' => $name,
                    'name' => ucfirst($name),
                    'enabled' => false,
                    'is_default' => $name === $this->defaultProvider,
                    'balance' => null,
                ];
            }
        })->values();
    }

    /**
     * Select cheapest provider
     */
    protected function selectCheapest(Collection $providers, string $country, string $product): SmsProviderInterface
    {
        return $providers->sortBy(function (SmsProviderInterface $provider) use ($country, $product) {
            try {
                $prices = $provider->getOperatorPrices($country, $product);
                $minCost = $prices->min('cost');
                return $minCost ?? PHP_FLOAT_MAX;
            } catch (\Exception $e) {
                return PHP_FLOAT_MAX;
            }
        })->first();
    }

    /**
     * Select provider with most available numbers
     */
    protected function selectMostAvailable(Collection $providers, string $country, string $product): SmsProviderInterface
    {
        return $providers->sortByDesc(function (SmsProviderInterface $provider) use ($country, $product) {
            try {
                $prices = $provider->getOperatorPrices($country, $product);
                return $prices->sum('available');
            } catch (\Exception $e) {
                return 0;
            }
        })->first();
    }

    /**
     * Select provider with highest success rate
     */
    protected function selectHighestSuccess(Collection $providers, string $country, string $product): SmsProviderInterface
    {
        return $providers->sortByDesc(function (SmsProviderInterface $provider) use ($country, $product) {
            try {
                $prices = $provider->getOperatorPrices($country, $product);
                $avgRate = $prices->avg('success_rate');
                return $avgRate ?? 0;
            } catch (\Exception $e) {
                return 0;
            }
        })->first();
    }

    /**
     * Clear cached data
     */
    public function clearCache(): void
    {
        Cache::forget('sms_aggregated_countries');
        Cache::forget('sms_countries_all');
        Cache::forget('sms_countries_5sim');
        Cache::forget('sms_countries_grizzlysms');
        // Note: Price/product cache keys include country/product, so they expire naturally
        // But we can flush them by pattern if using a cache driver that supports it
    }

    /**
     * Clear all SMS-related cache (useful for debugging)
     */
    public function clearAllCache(): void
    {
        $this->clearCache();

        // Clear common country/product combinations
        $countries = ['nigeria', 'usa', 'russia', 'england', 'india', 'indonesia', 'philippines', '36', '19', '12'];
        $operators = ['any'];
        $services = ['whatsapp', 'telegram', 'instagram', 'facebook', 'google', 'twitter', 'tiktok', 'wa', 'tg', 'ig', 'fb', 'go'];

        foreach ($countries as $country) {
            foreach ($operators as $operator) {
                Cache::forget("sms_products_{$country}_{$operator}_all");
                Cache::forget("sms_products_{$country}_{$operator}_5sim");
                Cache::forget("sms_products_{$country}_{$operator}_grizzlysms");
            }

            // Clear operator prices cache
            foreach ($services as $service) {
                Cache::forget("sms_operator_prices_{$country}_{$service}_all");
                Cache::forget("sms_aggregated_prices_{$country}_{$service}");
            }
        }

        // Clear exchange rate cache too
        Cache::forget('usd_to_ngn_rate');
    }
}
