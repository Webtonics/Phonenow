<?php

namespace App\Services;

use App\Contracts\SmmProviderInterface;
use App\Models\SmmCategory;
use App\Models\SmmService;
use App\Models\SmmOrder;
use App\Models\User;
use App\Models\Setting;
use App\Services\SmmProviders\JapProvider;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SmmManager
{
    protected array $providers = [];

    public function __construct(
        protected JapProvider $japProvider,
        // Add more providers here as needed
        // protected PeakerrProvider $peakerrProvider,
    ) {
        $this->registerProvider($this->japProvider);
        // $this->registerProvider($this->peakerrProvider);
    }

    /**
     * Register a provider
     */
    protected function registerProvider(SmmProviderInterface $provider): void
    {
        if ($provider->isEnabled()) {
            $this->providers[$provider->getIdentifier()] = $provider;
        }
    }

    /**
     * Get all enabled providers
     */
    public function getProviders(): array
    {
        return $this->providers;
    }

    /**
     * Get a specific provider
     */
    public function getProvider(string $identifier): ?SmmProviderInterface
    {
        return $this->providers[$identifier] ?? null;
    }

    /**
     * Sync services from all providers
     */
    public function syncServices(): array
    {
        $results = [];

        if (empty($this->providers)) {
            Log::warning("No SMM providers enabled");
            return [
                'warning' => true,
                'message' => 'No SMM providers are currently enabled. Check your configuration.',
                'providers' => [],
            ];
        }

        // Fetch fresh exchange rate before syncing prices
        try {
            app(ExchangeRateService::class)->updateExchangeRate();
            Log::info('Exchange rate refreshed before SMM sync');
        } catch (\Exception $e) {
            Log::warning('Could not refresh exchange rate before sync, using last known rate: ' . $e->getMessage());
        }

        foreach ($this->providers as $identifier => $provider) {
            try {
                $services = $provider->getServices();
                $serviceCount = $services->count();
                $syncResult = $this->storeServices($identifier, $services);

                // Extract synced count and errors
                $synced = is_array($syncResult) ? $syncResult['synced'] : $syncResult;
                $errors = is_array($syncResult) ? ($syncResult['errors'] ?? []) : [];

                $results[$identifier] = [
                    'success' => true,
                    'retrieved' => $serviceCount,
                    'synced' => $synced,
                    'failed' => $serviceCount - $synced,
                    'errors' => $errors,
                    'message' => "Retrieved {$serviceCount} services, synced {$synced}, failed " . ($serviceCount - $synced) . " from {$provider->getDisplayName()}",
                ];

                Log::info("SMM services synced from {$identifier}", [
                    'retrieved' => $serviceCount,
                    'synced' => $synced,
                    'failed' => $serviceCount - $synced,
                ]);
            } catch (\Exception $e) {
                $results[$identifier] = [
                    'success' => false,
                    'synced' => 0,
                    'message' => "Failed to sync from {$provider->getDisplayName()}: {$e->getMessage()}",
                ];

                Log::error("SMM service sync failed for {$identifier}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Store services from provider
     */
    protected function storeServices(string $provider, Collection $services): array
    {
        $synced = 0;
        $errors = [];

        foreach ($services as $serviceData) {
            try {
                // Get or create category
                $category = $this->getOrCreateCategory($serviceData['category']);

                // Calculate price with markup
                $costPer1000 = $serviceData['rate'];
                $pricePer1000 = $this->calculatePriceWithMarkup($costPer1000);

                // Update or create service
                SmmService::updateOrCreate(
                    [
                        'provider' => $provider,
                        'provider_service_id' => $serviceData['provider_service_id'],
                    ],
                    [
                        'category_id' => $category->id,
                        'name' => $serviceData['name'],
                        'description' => $serviceData['description'] ?? null,
                        'type' => $serviceData['type'],
                        'cost_per_1000' => $costPer1000,
                        'price_per_1000' => $pricePer1000,
                        'min_order' => $serviceData['min'],
                        'max_order' => $serviceData['max'],
                        'refill_enabled' => $serviceData['refill'] ?? false,
                        'cancel_enabled' => $serviceData['cancel'] ?? false,
                        'is_active' => true,
                        'last_synced_at' => now(),
                    ]
                );

                $synced++;
            } catch (\Exception $e) {
                // Collect first 3 unique errors for debugging
                $errorMsg = $e->getMessage();
                if (count($errors) < 3 && !in_array($errorMsg, $errors)) {
                    $errors[] = $errorMsg;
                }

                Log::warning("Failed to sync service: " . ($serviceData['name'] ?? 'Unknown'), [
                    'error' => $errorMsg,
                    'service_id' => $serviceData['provider_service_id'] ?? 'unknown',
                ]);
            }
        }

        // Log summary of errors if any occurred
        if (!empty($errors)) {
            Log::error("SMM sync errors for provider {$provider}", [
                'total_services' => $services->count(),
                'synced' => $synced,
                'failed' => $services->count() - $synced,
                'sample_errors' => $errors,
            ]);
        }

        return [
            'synced' => $synced,
            'errors' => $errors,
        ];
    }

    /**
     * Get or create category
     */
    protected function getOrCreateCategory(string $name): SmmCategory
    {
        $slug = Str::slug($name);

        return SmmCategory::firstOrCreate(
            ['slug' => $slug],
            [
                'name' => $name,
                'is_active' => true,
            ]
        );
    }

    /**
     * Calculate price with markup
     */
    protected function calculatePriceWithMarkup(float $cost): float
    {
        $markup = (float) Setting::getValue('smm_default_markup', config('smm.default_markup', 50));
        $price = $cost * (1 + ($markup / 100));

        // Convert USD to NGN (cost is already per 1000 from provider)
        $exchangeRate = app(ExchangeRateService::class)->getUsdToNgnRate();
        $priceInNgn = $price * $exchangeRate;

        // Cap at 99,999,999.99 to fit decimal(10,2) column
        return min(round($priceInNgn, 2), 99999999.99);
    }

    /**
     * Get the current fulfillment mode
     */
    public function getFulfillmentMode(): string
    {
        return Setting::getValue('smm_fulfillment_mode', 'manual');
    }

    /**
     * Create an order
     */
    public function createOrder(User $user, SmmService $service, string $link, int $quantity): array
    {
        // Validate quantity
        if ($quantity < $service->min_order || $quantity > $service->max_order) {
            return [
                'success' => false,
                'message' => "Quantity must be between {$service->min_order} and {$service->max_order}",
            ];
        }

        // Calculate cost
        $amount = $service->calculatePrice($quantity);
        $cost = $service->calculateCost($quantity);

        // Check user balance
        if ($user->balance < $amount) {
            return [
                'success' => false,
                'message' => 'Insufficient balance',
            ];
        }

        $fulfillmentMode = $this->getFulfillmentMode();

        DB::beginTransaction();

        try {
            $balanceBefore = $user->balance;

            // Deduct balance
            $user->deductBalance($amount);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Create transaction
            $transaction = $user->transactions()->create([
                'type' => 'debit',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'description' => "SMM Order: {$service->name}",
                'reference' => 'TXN-' . strtoupper(uniqid()),
            ]);

            if ($fulfillmentMode === 'manual') {
                // Manual mode: create order as awaiting_fulfillment, don't call provider
                $order = SmmOrder::create([
                    'user_id' => $user->id,
                    'service_id' => $service->id,
                    'reference' => SmmOrder::generateReference(),
                    'provider' => $service->provider,
                    'link' => $link,
                    'quantity' => $quantity,
                    'amount' => $amount,
                    'cost' => $cost,
                    'status' => 'awaiting_fulfillment',
                    'transaction_id' => $transaction->id,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);

                DB::commit();

                return [
                    'success' => true,
                    'message' => 'Order placed successfully! Your order is being processed.',
                    'data' => [
                        'order' => $order,
                        'reference' => $order->reference,
                    ],
                ];
            }

            // Auto mode: forward to provider
            $order = SmmOrder::create([
                'user_id' => $user->id,
                'service_id' => $service->id,
                'reference' => SmmOrder::generateReference(),
                'provider' => $service->provider,
                'link' => $link,
                'quantity' => $quantity,
                'amount' => $amount,
                'cost' => $cost,
                'status' => 'pending',
                'transaction_id' => $transaction->id,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);

            // Send order to provider
            $provider = $this->getProvider($service->provider);
            if (!$provider) {
                throw new \Exception('Provider not available');
            }

            $result = $provider->createOrder(
                $service->provider_service_id,
                $link,
                $quantity
            );

            if (!$result['success']) {
                throw new \Exception($result['message']);
            }

            // Update order with provider order ID
            $order->update([
                'provider_order_id' => $result['order_id'],
                'status' => 'processing',
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Order created successfully',
                'data' => [
                    'order' => $order,
                    'reference' => $order->reference,
                ],
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('SMM order creation failed', [
                'user_id' => $user->id,
                'service_id' => $service->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fulfill an order (admin manual fulfillment)
     */
    public function fulfillOrder(SmmOrder $order, ?string $providerOrderId = null, ?string $adminNotes = null): array
    {
        if ($order->status !== 'awaiting_fulfillment') {
            return [
                'success' => false,
                'message' => 'Only orders awaiting fulfillment can be fulfilled',
            ];
        }

        $order->update([
            'status' => 'completed',
            'provider_order_id' => $providerOrderId,
            'admin_notes' => $adminNotes,
            'completed_at' => now(),
            'fulfilled_at' => now(),
            'remains' => 0,
        ]);

        return [
            'success' => true,
            'message' => 'Order fulfilled successfully',
            'data' => $order->fresh(),
        ];
    }

    /**
     * Reject an order and refund the user (admin manual fulfillment)
     */
    public function rejectOrder(SmmOrder $order, string $reason): array
    {
        if ($order->status !== 'awaiting_fulfillment') {
            return [
                'success' => false,
                'message' => 'Only orders awaiting fulfillment can be rejected',
            ];
        }

        DB::beginTransaction();

        try {
            $user = $order->user;
            $balanceBefore = $user->balance;

            // Refund the user
            $user->increment('balance', $order->amount);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Create refund transaction
            $user->transactions()->create([
                'type' => 'credit',
                'amount' => $order->amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'description' => "SMM Order Refund: {$order->reference}",
                'reference' => 'TXN-' . strtoupper(uniqid()),
            ]);

            // Update order status
            $order->update([
                'status' => 'cancelled',
                'admin_notes' => $reason,
                'status_message' => 'Order rejected by admin: ' . $reason,
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Order rejected and user refunded',
                'data' => $order->fresh(),
            ];
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('SMM order rejection failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to reject order: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(SmmOrder $order): bool
    {
        if (!$order->provider_order_id) {
            return false;
        }

        $provider = $this->getProvider($order->provider);
        if (!$provider) {
            return false;
        }

        try {
            $result = $provider->getOrderStatus($order->provider_order_id);

            if (!$result['success']) {
                return false;
            }

            $order->update([
                'status' => $result['status'],
                'start_count' => $result['start_count'],
                'remains' => $result['remains'],
            ]);

            if ($result['status'] === 'completed') {
                $order->update(['completed_at' => now()]);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to update SMM order status', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(SmmOrder $order): array
    {
        if (!$order->isCancellable()) {
            return [
                'success' => false,
                'message' => 'Order cannot be cancelled',
            ];
        }

        $provider = $this->getProvider($order->provider);
        if (!$provider) {
            return [
                'success' => false,
                'message' => 'Provider not available',
            ];
        }

        try {
            $result = $provider->cancelOrder($order->provider_order_id);

            if ($result['success']) {
                $order->update(['status' => 'cancelled']);
            }

            return $result;
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check provider balances
     */
    public function checkProviderBalances(): array
    {
        $balances = [];

        foreach ($this->providers as $identifier => $provider) {
            try {
                $result = $provider->getBalance();
                $balances[$identifier] = $result;

                Log::info("SMM provider balance checked: {$identifier}", [
                    'balance' => $result['balance'] ?? 0,
                ]);
            } catch (\Exception $e) {
                $balances[$identifier] = [
                    'success' => false,
                    'balance' => 0,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $balances;
    }
}
