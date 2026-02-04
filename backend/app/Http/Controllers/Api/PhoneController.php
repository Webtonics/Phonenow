<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\ExchangeRateService;
use App\Services\SmsProviderManager;
use App\Services\ReferralService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PhoneController extends Controller
{
    public function __construct(
        protected SmsProviderManager $providerManager,
        protected ExchangeRateService $exchangeRateService
    ) {}

    /**
     * Get available SMS providers
     */
    public function getProviders(): JsonResponse
    {
        try {
            $providers = $this->providerManager->getProvidersInfo();

            return response()->json([
                'success' => true,
                'data' => $providers,
                'default' => $this->providerManager->getDefaultName(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get providers', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load providers',
            ], 500);
        }
    }

    /**
     * Test provider API connection
     */
    public function testProvider(Request $request): JsonResponse
    {
        $providerId = $request->query('provider');
        $clearCache = $request->query('clear_cache', false);

        // Clear cache if requested
        if ($clearCache) {
            $this->providerManager->clearAllCache();
            Cache::forget('sms_countries_all');
            Cache::forget('sms_countries_5sim');
            Cache::forget('sms_countries_grizzlysms');
        }

        try {
            $provider = $providerId
                ? $this->providerManager->provider($providerId)
                : $this->providerManager->getDefault();

            $balance = $provider->getBalance();
            $countries = $provider->getCountries()->take(5);

            return response()->json([
                'success' => true,
                'data' => [
                    'provider' => $provider->getDisplayName(),
                    'enabled' => $provider->isEnabled(),
                    'balance' => $balance->success ? [
                        'amount' => $balance->balance,
                        'currency' => $balance->currency,
                    ] : null,
                    'sample_countries' => $countries->map(fn($c) => $c->toArray())->values(),
                    'cache_cleared' => (bool) $clearCache,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'API test failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear SMS-related cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            $this->providerManager->clearAllCache();
            Cache::forget('sms_countries_all');
            Cache::forget('sms_countries_5sim');
            Cache::forget('sms_countries_grizzlysms');

            return response()->json([
                'success' => true,
                'message' => 'SMS cache cleared successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available countries
     * IMPORTANT: Does NOT cache empty results
     */
    public function getCountries(Request $request): JsonResponse
    {
        $providerId = $request->query('provider');
        $cacheKey = 'sms_countries_' . ($providerId ?? 'all');

        try {
            // Check cache first
            $countries = Cache::get($cacheKey);

            if (empty($countries)) {
                // Fetch from provider
                if ($providerId) {
                    $provider = $this->providerManager->provider($providerId);
                    $countriesCollection = $provider->getCountries();
                } else {
                    $countriesCollection = $this->providerManager->getAggregatedCountries();
                }

                // Convert to array format for frontend
                $countries = $countriesCollection
                    ->mapWithKeys(fn($c) => [$c->code => $c->toArray()])
                    ->toArray();

                // Only cache non-empty results
                if (!empty($countries)) {
                    Cache::put($cacheKey, $countries, config('sms.cache.countries', 3600));
                }
            }

            // Use fallback if still empty
            if (empty($countries)) {
                Log::warning('No countries returned, using fallback list');
                $countries = $this->getFallbackCountries();
            }

            return response()->json([
                'success' => true,
                'data' => $countries,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get countries', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => true,
                'data' => $this->getFallbackCountries(),
                'warning' => 'Using cached data due to connectivity issues',
            ]);
        }
    }

    /**
     * Get available services/products for a country
     * IMPORTANT: Does NOT cache empty results
     */
    public function getServices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country' => ['required', 'string'],
            'operator' => ['sometimes', 'string'],
            'provider' => ['sometimes', 'string'],
        ]);

        $country = $validated['country'];
        $operator = $validated['operator'] ?? 'any';
        $providerId = $validated['provider'] ?? null;

        $cacheKey = "sms_products_{$country}_{$operator}_" . ($providerId ?? 'all');

        try {
            // Check cache first
            $rawProducts = Cache::get($cacheKey);

            if (empty($rawProducts)) {
                // Fetch from provider
                if ($providerId) {
                    $provider = $this->providerManager->provider($providerId);
                    $rawProducts = $provider->getProducts($country, $operator)
                        ->map(fn($p) => array_merge($p->toArray(), ['provider' => $provider->getIdentifier()]))
                        ->toArray();
                } else {
                    $rawProducts = $this->providerManager->getEnabledProviders()
                        ->flatMap(fn($provider) => $provider->getProducts($country, $operator)
                            ->map(fn($p) => array_merge($p->toArray(), ['provider' => $provider->getIdentifier()])))
                        ->unique('code')
                        ->values()
                        ->toArray();
                }

                // Only cache non-empty results
                if (!empty($rawProducts)) {
                    Cache::put($cacheKey, $rawProducts, config('sms.cache.products', 1800));
                }
            }

            if (empty($rawProducts)) {
                // Return fallback services when no products available
                $fallbackServices = $this->getFallbackServices($country);
                return response()->json([
                    'success' => true,
                    'data' => $fallbackServices,
                    'warning' => 'Showing popular services. Live availability may vary.',
                ]);
            }

            // Format products with pricing (calculated fresh each time)
            $formattedProducts = collect($rawProducts)->map(function ($product) use ($country) {
                $basePrice = $product['base_price'] ?? 0;
                $baseCurrency = $product['base_currency'] ?? 'RUB';
                $productCode = $product['code'];

                // Calculate default price from product base price
                $defaultPrice = $this->calculateMarkupPrice($basePrice, $baseCurrency);

                // Try to get minimum operator price from cached aggregated prices
                $minPrice = $this->getMinimumOperatorPrice($country, $productCode, $defaultPrice);

                return [
                    'name' => $productCode,
                    'display_name' => $product['display_name'],
                    'quantity' => $product['quantity'],
                    'base_price' => $basePrice,
                    'base_currency' => $baseCurrency,
                    'price' => $defaultPrice,
                    'min_price' => $minPrice,
                    'category' => $product['category'] ?? 'other',
                    'provider' => $product['provider'] ?? null,
                ];
            })->sortByDesc('quantity')->values();

            return response()->json([
                'success' => true,
                'data' => $formattedProducts,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get services', [
                'country' => $country,
                'error' => $e->getMessage(),
            ]);

            // Return fallback services when API fails
            $fallbackServices = $this->getFallbackServices($country);

            return response()->json([
                'success' => true,
                'data' => $fallbackServices,
                'warning' => 'Using cached services. Live data temporarily unavailable.',
            ]);
        }
    }

    /**
     * Get prices for services
     */
    public function getPrices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country' => ['required', 'string'],
            'product' => ['sometimes', 'string'],
            'provider' => ['sometimes', 'string'],
        ]);

        $country = $validated['country'];
        $product = $validated['product'] ?? null;
        $providerId = $validated['provider'] ?? null;

        $cacheKey = "sms_prices_{$country}" . ($product ? "_{$product}" : '') . '_' . ($providerId ?? 'all');

        try {
            $prices = Cache::remember($cacheKey, config('sms.cache.prices', 300), function () use ($country, $product, $providerId) {
                if ($providerId) {
                    $provider = $this->providerManager->provider($providerId);
                    return $provider->getPrices($country, $product)
                        ->map(fn($p) => $p->toArray())
                        ->toArray();
                }

                return $this->providerManager->getAggregatedPrices($country, $product ?? '')
                    ->map(fn($p) => $p->toArray())
                    ->toArray();
            });

            return response()->json([
                'success' => true,
                'data' => $prices,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get prices', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to load prices',
            ], 500);
        }
    }

    /**
     * Get operator prices for a specific service
     * IMPORTANT: Does NOT cache empty results
     */
    public function getOperatorPrices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country' => ['required', 'string'],
            'product' => ['required', 'string'],
            'provider' => ['sometimes', 'string'],
        ]);

        $country = $validated['country'];
        $product = $validated['product'];
        $providerId = $validated['provider'] ?? null;

        $cacheKey = "sms_operator_prices_{$country}_{$product}_" . ($providerId ?? 'all');

        try {
            // Check cache first
            $rawOperators = Cache::get($cacheKey);

            if (empty($rawOperators)) {
                // Fetch from provider
                if ($providerId) {
                    $provider = $this->providerManager->provider($providerId);
                    $rawOperators = $provider->getOperatorPrices($country, $product)
                        ->map(fn($p) => $p->toArray())
                        ->toArray();
                } else {
                    $rawOperators = $this->providerManager->getAggregatedPrices($country, $product)
                        ->map(fn($p) => $p->toArray())
                        ->toArray();
                }

                // Only cache non-empty results
                if (!empty($rawOperators)) {
                    Cache::put($cacheKey, $rawOperators, config('sms.cache.prices', 300));
                }
            }

            // If still empty, return fallback
            if (empty($rawOperators)) {
                $fallbackPrices = $this->getFallbackOperatorPrices($product);
                return response()->json([
                    'success' => true,
                    'data' => $fallbackPrices,
                    'warning' => 'Showing estimated prices. Actual availability may vary.',
                ]);
            }

            // Calculate prices fresh each time
            $operators = collect($rawOperators)->map(function ($op) {
                $baseCost = $op['cost'] ?? 0;
                $baseCurrency = $op['currency'] ?? 'RUB';
                $priceNgn = $this->calculateMarkupPrice($baseCost, $baseCurrency);

                return [
                    'id' => $op['operator'],
                    'operator' => $op['operator'],
                    'price' => $priceNgn,
                    'base_price' => $baseCost,
                    'currency' => $baseCurrency,
                    'available' => $op['available'] ?? 0,
                    'success_rate' => isset($op['success_rate']) ? round($op['success_rate'], 1) : null,
                    'provider' => $op['provider'] ?? null,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $operators,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get operator prices', [
                'country' => $country,
                'product' => $product,
                'error' => $e->getMessage(),
            ]);

            // Return fallback pricing when API fails
            $fallbackPrices = $this->getFallbackOperatorPrices($product);
            return response()->json([
                'success' => true,
                'data' => $fallbackPrices,
                'warning' => 'Showing estimated prices. Actual availability may vary.',
            ]);
        }
    }

    /**
     * Purchase a phone number
     */
    public function buyNumber(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'country' => ['required', 'string'],
            'operator' => ['required', 'string'],
            'product' => ['required', 'string'],
            'provider' => ['sometimes', 'string'],
        ]);

        // Parse operator name - it may include provider suffix (e.g., "any_grizzlysms", "virtual40_5sim")
        $operatorInput = $validated['operator'];
        $realOperator = $operatorInput;
        $providerId = $validated['provider'] ?? null;

        // Check if operator contains provider suffix and extract it
        foreach (['_5sim', '_grizzlysms'] as $suffix) {
            if (str_ends_with($operatorInput, $suffix)) {
                $realOperator = substr($operatorInput, 0, -strlen($suffix));
                // Use provider from operator name if not explicitly provided
                if (!$providerId) {
                    $providerId = str_replace('_', '', $suffix); // '5sim' or 'grizzlysms'
                }
                break;
            }
        }

        try {
            if ($providerId) {
                $provider = $this->providerManager->provider($providerId);
            } else {
                $strategy = config('sms.selection_strategy', 'cheapest');
                $provider = $this->providerManager->selectBestProvider(
                    $validated['country'],
                    $validated['product'],
                    $strategy
                );
            }

            if (!$provider) {
                return response()->json([
                    'success' => false,
                    'message' => 'No providers available for this service.',
                ], 400);
            }

            Log::info('Phone number purchase started', [
                'user_id' => $user->id,
                'provider' => $provider->getIdentifier(),
                'country' => $validated['country'],
                'operator_input' => $operatorInput,
                'operator_parsed' => $realOperator,
                'product' => $validated['product'],
                'user_balance' => $user->balance,
            ]);

            // Get operator prices from selected provider
            $prices = $provider->getOperatorPrices($validated['country'], $validated['product']);
            $operatorPrice = $prices->firstWhere('operator', $realOperator) ?? $prices->first();

            if (!$operatorPrice || $operatorPrice->available <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No phone numbers available for this service.',
                ], 400);
            }

            $price = $this->calculateMarkupPrice($operatorPrice->cost, $operatorPrice->currency);

            Log::info('Price calculated', [
                'base_price' => $operatorPrice->cost,
                'currency' => $operatorPrice->currency,
                'final_price_ngn' => $price,
                'user_balance' => $user->balance,
            ]);

            // Check if user has sufficient balance
            if (!$user->hasBalance($price)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance. Please fund your wallet.',
                    'data' => [
                        'required' => $price,
                        'balance' => (float) $user->balance,
                    ],
                ], 400);
            }

            DB::beginTransaction();

            try {
                $balanceBefore = $user->balance;

                if (!$user->deductBalance($price)) {
                    throw new \Exception('Failed to deduct balance');
                }

                $user->refresh();
                $balanceAfter = $user->balance;

                // Create transaction
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount' => $price,
                    'status' => 'pending',
                    'reference' => Transaction::generateReference(),
                    'description' => "Phone number purchase: {$validated['product']} via {$provider->getDisplayName()}",
                    'payment_method' => 'wallet',
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);

                // Purchase from provider (use parsed operator name)
                $result = $provider->buyNumber(
                    $validated['country'],
                    $realOperator,
                    $validated['product'],
                    $user->id
                );

                if (!$result->success) {
                    // Refund the user
                    $user->addBalance($price);
                    $transaction->update([
                        'status' => 'failed',
                        'metadata' => ['error' => $result->errorMessage],
                    ]);

                    DB::commit();

                    return response()->json([
                        'success' => false,
                        'message' => $result->errorMessage ?? 'Failed to purchase number. Your balance has been refunded.',
                    ], 400);
                }

                // Create order
                $order = Order::create([
                    'user_id' => $user->id,
                    'service_id' => null,
                    'order_number' => Order::generateOrderNumber($user->id),
                    'type' => 'phone_number',
                    'status' => $provider->mapStatus($result->status ?? 'PENDING'),
                    'amount_paid' => $price,
                    'provider' => $provider->getIdentifier(),
                    'provider_order_id' => $result->providerOrderId,
                    'phone_number' => $result->phone,
                    'product_name' => $validated['product'],
                    'country_code' => $validated['country'],
                    'operator' => $result->operator ?? $validated['operator'],
                    'expires_at' => $result->expiresAt ?? now()->addMinutes(config('sms.order_expiration_minutes', 20)),
                    'provider_metadata' => [
                        'provider_price' => $operatorPrice->cost,
                        'provider_currency' => $operatorPrice->currency,
                    ],
                ]);

                Log::info('Order created successfully', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'phone_number' => $order->phone_number,
                    'provider' => $provider->getIdentifier(),
                ]);

                $transaction->update(['status' => 'completed']);

                // Process referral commission
                try {
                    $referralService = new ReferralService();
                    $commissionAmount = $referralService->processCommission($transaction, $user->id);
                    if ($commissionAmount) {
                        Log::info('Referral commission processed', [
                            'user_id' => $user->id,
                            'commission_amount' => $commissionAmount,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Referral commission processing failed', [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Phone number purchased successfully.',
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'phone' => $result->phone,
                        'product' => $validated['product'],
                        'operator' => $order->operator,
                        'country' => $validated['country'],
                        'provider' => $provider->getDisplayName(),
                        'status' => $order->status,
                        'price' => $price,
                        'expires_at' => $order->expires_at?->toISOString(),
                        'balance' => (float) $user->fresh()->balance,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Phone number purchase failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred during purchase. Please try again.',
                'debug' => config('app.debug') ? [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : null,
            ], 500);
        }
    }

    /**
     * Get order status and SMS
     */
    public function checkOrder(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone_number')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        // If order is already in final state, return cached data
        if (in_array($order->status, ['completed', 'cancelled', 'refunded', 'expired'])) {
            return $this->formatOrderResponse($order);
        }

        try {
            // Get the correct provider for this order
            $provider = $this->providerManager->getProviderForOrder($order);

            $result = $provider->checkOrder($order->provider_order_id, $user->id);

            if (!$result->success) {
                return response()->json([
                    'success' => false,
                    'message' => $result->errorMessage ?? 'Failed to check order status.',
                ], 400);
            }

            // Update order if status changed or SMS received
            if ($order->status !== $result->mappedStatus || ($result->hasReceivedSms() && !$order->sms_code)) {
                $updateData = ['status' => $result->mappedStatus];

                if ($result->hasReceivedSms() && !empty($result->sms)) {
                    $latestSms = end($result->sms);
                    $updateData['sms_code'] = $latestSms->code;
                    $updateData['sms_text'] = $latestSms->text;
                }

                $order->update($updateData);
                $order->refresh();
            }

            return $this->formatOrderResponse($order);
        } catch (\Exception $e) {
            Log::error('Failed to check order', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            // Return cached data on error
            return $this->formatOrderResponse($order);
        }
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone_number')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!$order->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled.',
            ], 400);
        }

        try {
            $provider = $this->providerManager->getProviderForOrder($order);

            if (!$provider->cancelOrder($order->provider_order_id, $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to cancel order with provider.',
                ], 400);
            }

            DB::beginTransaction();

            try {
                $order->update(['status' => 'cancelled']);

                // Refund user
                $balanceBefore = $user->balance;
                $user->addBalance($order->amount_paid);
                $user->refresh();
                $balanceAfter = $user->balance;

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $order->amount_paid,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'status' => 'completed',
                    'reference' => Transaction::generateReference(),
                    'description' => "Refund for cancelled order: {$order->order_number}",
                    'payment_method' => 'refund',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Order cancelled and refunded successfully.',
                    'data' => [
                        'order_id' => $order->id,
                        'refunded_amount' => (float) $order->amount_paid,
                        'balance' => (float) $user->fresh()->balance,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Order cancellation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while cancelling the order.',
            ], 500);
        }
    }

    /**
     * Finish/complete an order
     */
    public function finishOrder(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone_number')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->status !== 'processing') {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be finished. SMS must be received first.',
            ], 400);
        }

        try {
            $provider = $this->providerManager->getProviderForOrder($order);

            if (!$provider->finishOrder($order->provider_order_id, $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to finish order with provider.',
                ], 400);
            }

            $order->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Order completed successfully.',
                'data' => [
                    'order_id' => $order->id,
                    'status' => 'completed',
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Order finish failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while finishing the order.',
            ], 500);
        }
    }

    /**
     * Report/ban a bad number
     */
    public function reportNumber(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone_number')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!in_array($order->status, ['pending', 'processing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be reported.',
            ], 400);
        }

        try {
            $provider = $this->providerManager->getProviderForOrder($order);

            if (!$provider->banOrder($order->provider_order_id, $user->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to report number.',
                ], 400);
            }

            DB::beginTransaction();

            try {
                $order->update([
                    'status' => 'refunded',
                    'failure_reason' => $request->input('reason', 'Bad number'),
                ]);

                // Refund user
                $balanceBefore = $user->balance;
                $user->addBalance($order->amount_paid);
                $user->refresh();
                $balanceAfter = $user->balance;

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $order->amount_paid,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'status' => 'completed',
                    'reference' => Transaction::generateReference(),
                    'description' => "Refund for reported number: {$order->order_number}",
                    'payment_method' => 'refund',
                ]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Number reported and refunded successfully.',
                    'data' => [
                        'order_id' => $order->id,
                        'refunded_amount' => (float) $order->amount_paid,
                        'balance' => (float) $user->fresh()->balance,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Number report failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while reporting the number.',
            ], 500);
        }
    }

    /**
     * Get user's phone orders
     */
    public function getOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'status' => ['sometimes', 'in:pending,processing,completed,cancelled,expired,refunded,failed'],
            'provider' => ['sometimes', 'string'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = Order::where('user_id', $user->id)
            ->where('type', 'phone_number');

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['provider'])) {
            $query->where('provider', $validated['provider']);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => collect($orders->items())->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'phone' => $order->phone_number,
                'product' => $order->product_name,
                'operator' => $order->operator ?? $order->provider,
                'country' => $order->country_code,
                'provider' => $order->provider,
                'status' => $order->status,
                'price' => (float) $order->amount_paid,
                'sms' => $order->sms_code ? [['code' => $order->sms_code, 'text' => $order->sms_text ?? '']] : [],
                'expires_at' => $order->expires_at?->toISOString(),
                'created_at' => $order->created_at->toISOString(),
            ]),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Format order response
     */
    protected function formatOrderResponse(Order $order): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'phone' => $order->phone_number,
                'product' => $order->product_name,
                'operator' => $order->operator ?? $order->provider,
                'country' => $order->country_code,
                'provider' => $order->provider,
                'status' => $order->status,
                'price' => (float) $order->amount_paid,
                'sms' => $order->sms_code ? [['code' => $order->sms_code, 'text' => $order->sms_text ?? '']] : [],
                'expires_at' => $order->expires_at?->toISOString(),
                'created_at' => $order->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Calculate markup price using admin settings and exchange rates
     *
     * IMPORTANT: All provider prices are treated as USD.
     * - GrizzlySMS returns prices in USD
     * - 5SIM returns prices that should be treated as USD-equivalent
     *
     * Formula: Final Price = (API Cost in USD × Exchange Rate × Markup%) + Platform Fee
     *
     * @param float $basePrice Base price from provider (in USD)
     * @param string $baseCurrency Currency label (for logging only, all treated as USD)
     * @return float Final price in NGN
     */
    protected function calculateMarkupPrice(float $basePrice, string $baseCurrency = 'USD'): float
    {
        try {
            // Get USD to NGN exchange rate from admin settings
            $usdToNgn = $this->exchangeRateService->getUsdToNgnRate();

            // Treat all prices as USD (providers return USD or USD-equivalent amounts)
            $priceInUsd = $basePrice;

            // Convert USD to NGN
            $priceInNgn = $priceInUsd * $usdToNgn;

            // Get markup settings
            $markupPercentage = (float) Setting::getValue('phone_markup_percentage', 200);
            $minPrice = (float) Setting::getValue('phone_min_price', 500);
            $platformFee = (float) Setting::getValue('phone_platform_fee', 0);

            // Apply markup (200% = 2x, 300% = 3x, etc.)
            $markupMultiplier = $markupPercentage / 100;
            $finalPrice = ($priceInNgn * $markupMultiplier) + $platformFee;

            Log::debug('Price calculation', [
                'base_price_usd' => $priceInUsd,
                'exchange_rate' => $usdToNgn,
                'price_ngn_before_markup' => $priceInNgn,
                'markup_percentage' => $markupPercentage,
                'markup_multiplier' => $markupMultiplier,
                'platform_fee' => $platformFee,
                'final_price' => $finalPrice,
                'min_price' => $minPrice,
            ]);

            return max(round($finalPrice, 2), $minPrice);
        } catch (\Exception $e) {
            Log::warning('Price calculation error, using fallback', ['error' => $e->getMessage()]);

            // Fallback pricing: USD × 1600 × 2 (200% markup)
            $priceInNgn = $basePrice * 1600;
            $finalPrice = $priceInNgn * 2;
            return max(round($finalPrice, 2), 500);
        }
    }

    /**
     * Get the minimum operator price for a product from cached aggregated prices
     * Uses cache only for performance - falls back to default price if not cached
     *
     * @param string $country
     * @param string $product
     * @param float $defaultPrice Fallback price if no operator prices available
     * @return float Minimum price in NGN
     */
    protected function getMinimumOperatorPrice(string $country, string $product, float $defaultPrice): float
    {
        try {
            // Check cache only - don't make fresh API calls for performance
            $cacheKey = "sms_aggregated_prices_{$country}_{$product}";
            $cachedPrices = Cache::get($cacheKey);

            if ($cachedPrices === null || $cachedPrices->isEmpty()) {
                return $defaultPrice;
            }

            // Find the minimum cost from cached operator prices
            $minCost = $cachedPrices->min('cost');
            if ($minCost === null || $minCost <= 0) {
                return $defaultPrice;
            }

            // Calculate the marked-up price for the minimum cost
            $minPrice = $this->calculateMarkupPrice($minCost, 'USD');

            return $minPrice;
        } catch (\Exception $e) {
            Log::debug('Failed to get minimum operator price', [
                'country' => $country,
                'product' => $product,
                'error' => $e->getMessage(),
            ]);
            return $defaultPrice;
        }
    }

    /**
     * Get fallback countries list when API is unavailable
     */
    protected function getFallbackCountries(): array
    {
        // Return as object keyed by country code for frontend compatibility
        return [
            'nigeria' => ['code' => 'nigeria', 'name' => 'Nigeria', 'text_en' => 'Nigeria', 'prefix' => '+234', 'iso' => 'NG'],
            'usa' => ['code' => 'usa', 'name' => 'United States', 'text_en' => 'United States', 'prefix' => '+1', 'iso' => 'US'],
            'england' => ['code' => 'england', 'name' => 'United Kingdom', 'text_en' => 'United Kingdom', 'prefix' => '+44', 'iso' => 'GB'],
            'russia' => ['code' => 'russia', 'name' => 'Russia', 'text_en' => 'Russia', 'prefix' => '+7', 'iso' => 'RU'],
            'india' => ['code' => 'india', 'name' => 'India', 'text_en' => 'India', 'prefix' => '+91', 'iso' => 'IN'],
            'indonesia' => ['code' => 'indonesia', 'name' => 'Indonesia', 'text_en' => 'Indonesia', 'prefix' => '+62', 'iso' => 'ID'],
            'philippines' => ['code' => 'philippines', 'name' => 'Philippines', 'text_en' => 'Philippines', 'prefix' => '+63', 'iso' => 'PH'],
        ];
    }

    /**
     * Get fallback services when API is unavailable
     */
    protected function getFallbackServices(string $country = ''): array
    {
        $minPrice = (float) Setting::getValue('phone_min_price', 500);

        // Popular services with estimated prices
        $services = [
            ['name' => 'whatsapp', 'display_name' => 'WhatsApp', 'quantity' => 100, 'price' => $minPrice * 1.5, 'category' => 'social'],
            ['name' => 'telegram', 'display_name' => 'Telegram', 'quantity' => 150, 'price' => $minPrice * 1.2, 'category' => 'social'],
            ['name' => 'google', 'display_name' => 'Google/Gmail', 'quantity' => 200, 'price' => $minPrice * 1.3, 'category' => 'email'],
            ['name' => 'facebook', 'display_name' => 'Facebook', 'quantity' => 80, 'price' => $minPrice * 1.4, 'category' => 'social'],
            ['name' => 'instagram', 'display_name' => 'Instagram', 'quantity' => 90, 'price' => $minPrice * 1.6, 'category' => 'social'],
            ['name' => 'twitter', 'display_name' => 'Twitter/X', 'quantity' => 70, 'price' => $minPrice * 1.3, 'category' => 'social'],
            ['name' => 'tiktok', 'display_name' => 'TikTok', 'quantity' => 60, 'price' => $minPrice * 1.5, 'category' => 'social'],
            ['name' => 'amazon', 'display_name' => 'Amazon', 'quantity' => 50, 'price' => $minPrice * 2.0, 'category' => 'shopping'],
            ['name' => 'microsoft', 'display_name' => 'Microsoft', 'quantity' => 40, 'price' => $minPrice * 1.8, 'category' => 'email'],
            ['name' => 'yahoo', 'display_name' => 'Yahoo', 'quantity' => 45, 'price' => $minPrice * 1.2, 'category' => 'email'],
            ['name' => 'discord', 'display_name' => 'Discord', 'quantity' => 55, 'price' => $minPrice * 1.4, 'category' => 'social'],
            ['name' => 'uber', 'display_name' => 'Uber', 'quantity' => 30, 'price' => $minPrice * 2.5, 'category' => 'transport'],
            ['name' => 'paypal', 'display_name' => 'PayPal', 'quantity' => 25, 'price' => $minPrice * 3.0, 'category' => 'finance'],
            ['name' => 'netflix', 'display_name' => 'Netflix', 'quantity' => 35, 'price' => $minPrice * 2.0, 'category' => 'streaming'],
            ['name' => 'spotify', 'display_name' => 'Spotify', 'quantity' => 40, 'price' => $minPrice * 1.5, 'category' => 'streaming'],
        ];

        return collect($services)->map(function ($service) {
            $price = round($service['price'], 2);
            return [
                'name' => $service['name'],
                'display_name' => $service['display_name'],
                'quantity' => $service['quantity'],
                'base_price' => 0,
                'base_currency' => 'NGN',
                'price' => $price,
                'min_price' => $price,
                'category' => $service['category'],
                'provider' => 'fallback',
            ];
        })->sortByDesc('quantity')->values()->toArray();
    }

    /**
     * Get fallback operator prices when API is unavailable
     */
    protected function getFallbackOperatorPrices(string $product): array
    {
        $minPrice = (float) Setting::getValue('phone_min_price', 500);

        // Service-specific pricing multipliers
        $multipliers = [
            'whatsapp' => 1.5, 'telegram' => 1.2, 'google' => 1.3,
            'facebook' => 1.4, 'instagram' => 1.6, 'twitter' => 1.3,
            'tiktok' => 1.5, 'amazon' => 2.0, 'microsoft' => 1.8,
            'paypal' => 3.0, 'uber' => 2.5, 'netflix' => 2.0,
        ];

        $multiplier = $multipliers[$product] ?? 1.5;

        return [
            [
                'id' => 'any',
                'operator' => 'any',
                'price' => round($minPrice * $multiplier, 2),
                'base_price' => 0,
                'currency' => 'NGN',
                'available' => 50,
                'success_rate' => null,
                'provider' => 'fallback',
            ],
        ];
    }
}
