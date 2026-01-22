<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\ExchangeRateService;
use App\Services\FiveSimService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PhoneController extends Controller
{
    public function __construct(
        protected FiveSimService $fiveSimService,
        protected ExchangeRateService $exchangeRateService
    ) {}

    /**
     * Test 5SIM API connection and get profile
     */
    public function test5SIM(): JsonResponse
    {
        try {
            // Get profile/balance
            $profile = $this->fiveSimService->getProfile();

            // Get Nigeria products
            $products = $this->fiveSimService->getProducts('nigeria', 'any');

            // Get WhatsApp specifically
            $whatsapp = null;
            if ($products['success'] && isset($products['data']['whatsapp'])) {
                $whatsapp = $products['data']['whatsapp'];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'profile' => $profile,
                    'total_products' => $products['success'] ? count($products['data']) : 0,
                    'whatsapp' => $whatsapp,
                    'all_products' => $products['success'] ? $products['data'] : [],
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
     * Get available countries
     */
    public function getCountries(): JsonResponse
    {
        try {
            // Try to get from cache first
            $countries = Cache::get('5sim_countries');

            if (!$countries) {
                // Fetch from API
                $result = $this->fiveSimService->getCountries();

                if ($result['success'] && !empty($result['data'])) {
                    $countries = $result['data'];
                    // Cache successful result for 1 hour
                    Cache::put('5sim_countries', $countries, 3600);
                } else {
                    // Use fallback list of common countries
                    Log::warning('5SIM countries API failed, using fallback list');
                    $countries = $this->getFallbackCountries();
                }
            }

            return response()->json([
                'success' => true,
                'data' => $countries,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get countries', ['error' => $e->getMessage()]);

            // Return fallback countries instead of error
            return response()->json([
                'success' => true,
                'data' => $this->getFallbackCountries(),
                'warning' => 'Using cached data due to connectivity issues',
            ]);
        }
    }

    /**
     * Get available services/products for a country
     */
    public function getServices(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country' => ['required', 'string'],
            'operator' => ['sometimes', 'string'],
        ]);

        $country = $validated['country'];
        $operator = $validated['operator'] ?? 'any';

        $cacheKey = "5sim_products_{$country}_{$operator}";

        try {
            // Try to get from cache first
            $cachedProducts = Cache::get($cacheKey);

            if ($cachedProducts) {
                return response()->json([
                    'success' => true,
                    'data' => $cachedProducts,
                ]);
            }

            // Fetch from API
            $result = $this->fiveSimService->getProducts($country, $operator);

            if (!$result['success'] || empty($result['data'])) {
                Log::warning('5SIM products API failed', ['country' => $country]);

                return response()->json([
                    'success' => true,
                    'data' => [],
                    'warning' => 'Unable to fetch services. Please check your internet connection.',
                ]);
            }

            $products = $result['data'];

            // Format products with pricing
            $formattedProducts = [];
            foreach ($products as $productName => $productData) {
                $quantity = $productData['Qty'] ?? 0;
                $basePrice = $productData['Price'] ?? 0;

                $formattedProducts[] = [
                    'name' => $productName,
                    'display_name' => ucfirst(str_replace('_', ' ', $productName)),
                    'quantity' => $quantity,
                    'base_price' => $basePrice,
                    'price' => $this->calculateMarkupPrice($basePrice),
                    'category' => 'social',
                ];
            }

            // Sort by quantity (availability)
            usort($formattedProducts, fn($a, $b) => $b['quantity'] <=> $a['quantity']);

            // Cache successful result for 30 minutes
            Cache::put($cacheKey, $formattedProducts, 1800);

            return response()->json([
                'success' => true,
                'data' => $formattedProducts,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get services', [
                'country' => $country,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => true,
                'data' => [],
                'warning' => 'Unable to fetch services. Please check your internet connection.',
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
        ]);

        $country = $validated['country'];
        $product = $validated['product'] ?? '';

        $cacheKey = "5sim_prices_{$country}" . ($product ? "_{$product}" : '');

        try {
            $prices = Cache::remember($cacheKey, 1800, function () use ($country, $product) {
                $result = $this->fiveSimService->getPrices($country, $product);
                return $result['success'] ? $result['data'] : [];
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
     * Purchase a phone number - SIMPLIFIED
     */
    public function buyNumber(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'country' => ['required', 'string'],
            'operator' => ['required', 'string'],
            'product' => ['required', 'string'],
        ]);

        Log::info('Phone number purchase started', [
            'user_id' => $user->id,
            'country' => $validated['country'],
            'operator' => $validated['operator'],
            'product' => $validated['product'],
            'user_balance' => $user->balance,
        ]);

        try {
            // Get products to find the base price
            $productsResult = $this->fiveSimService->getProducts($validated['country'], $validated['operator']);

            Log::info('Products fetched', [
                'success' => $productsResult['success'],
                'has_product' => isset($productsResult['data'][$validated['product']]),
            ]);

            if (!$productsResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to get service information. Please try again.',
                ], 400);
            }

            $productData = $productsResult['data'][$validated['product']] ?? null;

            if (!$productData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Service not available.',
                ], 400);
            }

            // Check if service is available
            if (($productData['Qty'] ?? 0) <= 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No phone numbers available for this service right now.',
                ], 400);
            }

            $basePrice = $productData['Price'] ?? 0;
            $price = $this->calculateMarkupPrice($basePrice);

            Log::info('Price calculated', [
                'base_price_usd' => $basePrice,
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
                // Capture balance before deduction
                $balanceBefore = $user->balance;

                Log::info('Starting balance deduction', [
                    'balance_before' => $balanceBefore,
                    'amount_to_deduct' => $price,
                ]);

                // Deduct balance
                if (!$user->deductBalance($price)) {
                    throw new \Exception('Failed to deduct balance');
                }

                // Refresh user to get updated balance
                $user->refresh();
                $balanceAfter = $user->balance;

                Log::info('Balance deducted successfully', [
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);

                // Create transaction (debit for purchases)
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'debit',
                    'amount' => $price,
                    'status' => 'pending',
                    'reference' => Transaction::generateReference(),
                    'description' => "Phone number purchase: {$validated['product']}",
                    'payment_method' => 'refund', // Using refund as placeholder for wallet purchases
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                ]);

                Log::info('Transaction created', [
                    'transaction_id' => $transaction->id,
                    'reference' => $transaction->reference,
                ]);

                // Purchase from 5SIM
                Log::info('Calling 5SIM API to purchase number');

                $result = $this->fiveSimService->buyNumber(
                    $validated['country'],
                    $validated['operator'],
                    $validated['product'],
                    $user->id
                );

                Log::info('5SIM API response', [
                    'success' => $result['success'],
                    'data' => $result['data'] ?? null,
                    'message' => $result['message'] ?? null,
                ]);

                if (!$result['success']) {
                    // Refund the user
                    $user->addBalance($price);
                    $transaction->update([
                        'status' => 'failed',
                        'metadata' => ['error' => $result['message'] ?? 'Purchase failed'],
                    ]);

                    DB::commit();

                    return response()->json([
                        'success' => false,
                        'message' => $result['message'] ?? 'Failed to purchase number. Your balance has been refunded.',
                    ], 400);
                }

                $orderData = $result['data'];

                // Create order
                $order = Order::create([
                    'user_id' => $user->id,
                    'service_id' => null,
                    'order_number' => Order::generateOrderNumber($user->id),
                    'type' => 'phone_number',
                    'status' => 'processing',
                    'amount_paid' => $price,
                    'provider' => '5sim',
                    'provider_order_id' => (string) $orderData['order_id'],
                    'phone_number' => $orderData['phone'],
                    'expires_at' => isset($orderData['expires']) ? \Carbon\Carbon::parse($orderData['expires']) : now()->addMinutes(20),
                ]);

                Log::info('Order created successfully', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'phone_number' => $order->phone_number,
                ]);

                // Update transaction status to completed
                $transaction->update([
                    'status' => 'completed',
                ]);

                Log::info('Transaction marked as completed', ['transaction_id' => $transaction->id]);

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Phone number purchased successfully.',
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'phone' => $orderData['phone'],
                        'product' => $orderData['product'],
                        'operator' => $orderData['operator'],
                        'country' => $orderData['country'],
                        'status' => $order->status,
                        'price' => $price,
                        'expires' => $orderData['expires'],
                        'balance' => (float) $user->fresh()->balance,
                    ],
                ]);
            } catch (\Exception $e) {
                DB::rollBack();

                Log::error('Phone number purchase failed - Inner exception', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                    'error_code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
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
        } catch (\Exception $e) {
            Log::error('Phone number purchase validation failed - Outer exception', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred. Please try again.',
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
            ->where('type', 'phone')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        // If order is already completed/cancelled/refunded, return cached data
        if (in_array($order->status, ['completed', 'cancelled', 'refunded', 'expired'])) {
            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'phone' => $order->metadata['phone'] ?? null,
                    'product' => $order->metadata['product'] ?? null,
                    'status' => $order->status,
                    'sms' => $order->metadata['sms'] ?? [],
                    'expires' => $order->metadata['expires'] ?? null,
                ],
            ]);
        }

        // Check with 5SIM
        $result = $this->fiveSimService->checkOrder($order->external_order_id, $user->id);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to check order status.',
            ], 400);
        }

        $orderData = $result['data'];
        $newStatus = FiveSimService::mapStatus($orderData['status']);

        // Update order if status changed
        if ($order->status !== $newStatus || !empty($orderData['sms'])) {
            $order->update([
                'status' => $newStatus,
                'metadata' => array_merge($order->metadata ?? [], [
                    'sms' => $orderData['sms'],
                    'last_checked' => now()->toISOString(),
                ]),
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'phone' => $orderData['phone'],
                'product' => $orderData['product'],
                'operator' => $orderData['operator'],
                'status' => $newStatus,
                'sms' => $orderData['sms'],
                'expires' => $orderData['expires'],
            ],
        ]);
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!in_array($order->status, ['pending', 'active'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled.',
            ], 400);
        }

        // Cancel with 5SIM
        $result = $this->fiveSimService->cancelOrder($order->external_order_id, $user->id);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to cancel order.',
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Update order status
            $order->update([
                'status' => 'cancelled',
                'metadata' => array_merge($order->metadata ?? [], [
                    'cancelled_at' => now()->toISOString(),
                ]),
            ]);

            // Refund user (5SIM refunds automatically on cancel)
            $user->addBalance($order->price);

            // Create refund transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => $order->price,
                'currency' => 'NGN',
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => "Refund for cancelled order: {$order->order_number}",
                'payment_method' => 'wallet',
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled and refunded successfully.',
                'data' => [
                    'order_id' => $order->id,
                    'refunded_amount' => (float) $order->price,
                    'balance' => (float) $user->fresh()->balance,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

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
            ->where('type', 'phone')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be finished. SMS must be received first.',
            ], 400);
        }

        // Finish with 5SIM
        $result = $this->fiveSimService->finishOrder($order->external_order_id, $user->id);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to finish order.',
            ], 400);
        }

        $order->update([
            'status' => 'completed',
            'metadata' => array_merge($order->metadata ?? [], [
                'completed_at' => now()->toISOString(),
            ]),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order completed successfully.',
            'data' => [
                'order_id' => $order->id,
                'status' => 'completed',
            ],
        ]);
    }

    /**
     * Report/ban a bad number
     */
    public function reportNumber(Request $request, string $orderId): JsonResponse
    {
        $user = $request->user();

        $order = Order::where('id', $orderId)
            ->where('user_id', $user->id)
            ->where('type', 'phone')
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!in_array($order->status, ['pending', 'active'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be reported.',
            ], 400);
        }

        // Ban with 5SIM
        $result = $this->fiveSimService->banOrder($order->external_order_id, $user->id);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'] ?? 'Failed to report number.',
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Update order status
            $order->update([
                'status' => 'refunded',
                'metadata' => array_merge($order->metadata ?? [], [
                    'reported_at' => now()->toISOString(),
                    'report_reason' => $request->input('reason', 'Bad number'),
                ]),
            ]);

            // Refund user
            $user->addBalance($order->price);

            // Create refund transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'refund',
                'amount' => $order->price,
                'currency' => 'NGN',
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => "Refund for reported number: {$order->order_number}",
                'payment_method' => 'wallet',
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Number reported and refunded successfully.',
                'data' => [
                    'order_id' => $order->id,
                    'refunded_amount' => (float) $order->price,
                    'balance' => (float) $user->fresh()->balance,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

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
            'status' => ['sometimes', 'in:pending,active,completed,cancelled,expired,refunded'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = Order::where('user_id', $user->id)
            ->where('type', 'phone');

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => collect($orders->items())->map(fn($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'phone' => $order->metadata['phone'] ?? null,
                'product' => $order->metadata['product'] ?? null,
                'operator' => $order->metadata['operator'] ?? null,
                'country' => $order->metadata['country'] ?? null,
                'status' => $order->status,
                'price' => (float) $order->price,
                'sms' => $order->metadata['sms'] ?? [],
                'expires' => $order->metadata['expires'] ?? null,
                'created_at' => $order->created_at,
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
     * Calculate markup price using admin settings and live exchange rates
     *
     * @param float $basePrice Base price in USD from 5SIM API
     * @return float Final price in NGN
     */
    protected function calculateMarkupPrice(float $basePrice): float
    {
        try {
            // Get live USD to NGN exchange rate
            $exchangeRate = $this->exchangeRateService->getUsdToNgnRate();

            // Get markup percentage from admin settings
            $markupPercentage = Setting::getValue('phone_markup_percentage', 1000);
            $minPrice = Setting::getValue('phone_min_price', 500);
            $platformFee = Setting::getValue('phone_platform_fee', 0);

            // Convert USD to NGN
            $priceInNgn = $basePrice * $exchangeRate;

            // Apply markup
            $markupMultiplier = $markupPercentage / 100;
            $finalPrice = ($priceInNgn * $markupMultiplier) + $platformFee;

            return max(round($finalPrice, 2), $minPrice);
        } catch (\Exception $e) {
            // Fallback to hardcoded values if anything fails
            Log::warning('Using default pricing', [
                'error' => $e->getMessage(),
            ]);

            $priceInNgn = $basePrice * 1600; // 1 USD = 1600 NGN (fallback)
            $finalPrice = $priceInNgn * 10; // 1000% markup = 10x
            return max(round($finalPrice, 2), 500); // Min ₦500
        }
    }

    /**
     * Get fallback countries list when API is unavailable
     */
    protected function getFallbackCountries(): array
    {
        return [
            'nigeria' => [
                'name' => 'Nigeria',
                'iso' => 234,
                'prefix' => '+234',
            ],
            'usa' => [
                'name' => 'United States',
                'iso' => 'us',
                'prefix' => '+1',
            ],
            'england' => [
                'name' => 'United Kingdom',
                'iso' => 'gb',
                'prefix' => '+44',
            ],
            'russia' => [
                'name' => 'Russia',
                'iso' => 'ru',
                'prefix' => '+7',
            ],
            'india' => [
                'name' => 'India',
                'iso' => 'in',
                'prefix' => '+91',
            ],
            'indonesia' => [
                'name' => 'Indonesia',
                'iso' => 'id',
                'prefix' => '+62',
            ],
            'philippines' => [
                'name' => 'Philippines',
                'iso' => 'ph',
                'prefix' => '+63',
            ],
        ];
    }
}
