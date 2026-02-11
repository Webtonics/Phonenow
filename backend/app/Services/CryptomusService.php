<?php

namespace App\Services;

use App\Models\ApiLog;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CryptomusService
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $merchantId;
    protected const MIN_DEPOSIT_NGN = 10000; // Minimum deposit 10,000 NGN

    public function __construct(
        protected ExchangeRateService $exchangeRateService
    ) {
        $this->baseUrl = config('services.cryptomus.base_url') ?? 'https://api.cryptomus.com/v1';
        $this->apiKey = config('services.cryptomus.api_key') ?? '';
        $this->merchantId = config('services.cryptomus.merchant_id') ?? '';
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->merchantId);
    }

    /**
     * Initialize a payment transaction
     */
    public function initializePayment(User $user, float $amount, string $currency = 'USD'): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Cryptomus payment gateway is not configured',
            ];
        }

        // Validate minimum deposit for NGN
        if ($currency === 'NGN' && $amount < self::MIN_DEPOSIT_NGN) {
            return [
                'success' => false,
                'message' => 'Minimum deposit is ₦' . number_format(self::MIN_DEPOSIT_NGN) . '. Please increase your deposit amount.',
            ];
        }

        $reference = Transaction::generateReference();

        // Convert NGN to USD using live exchange rate
        if ($currency === 'NGN') {
            $exchangeRate = $this->exchangeRateService->getUsdToNgnRate();
            $amountUSD = round($amount / $exchangeRate, 2);

            Log::info('Cryptomus payment: NGN to USD conversion', [
                'amount_ngn' => $amount,
                'exchange_rate' => $exchangeRate,
                'amount_usd' => $amountUSD,
            ]);
        } else {
            $amountUSD = $amount;
        }

        $payload = [
            'amount' => (string) $amountUSD,
            'currency' => 'USD',
            'order_id' => $reference,
            'url_return' => config('app.frontend_url') . '/wallet/success',
            'url_callback' => config('app.url') . '/api/webhooks/cryptomus',
            'is_payment_multiple' => false,
            'lifetime' => 7200, // 2 hours
            'to_currency' => 'USDT', // Preferred crypto currency
        ];

        $sign = $this->generateSignature($payload);

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'merchant' => $this->merchantId,
                'sign' => $sign,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment', $payload);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/payment',
                'POST',
                $response->status(),
                $responseTime,
                $user->id
            );

            $data = $response->json();

            if ($response->successful() && isset($data['state']) && $data['state'] === 0) {
                $result = $data['result'];

                // Create pending transaction
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $user->balance,
                    'balance_after' => $user->balance,
                    'description' => 'Wallet funding via cryptocurrency',
                    'status' => 'pending',
                    'reference' => $reference,
                    'payment_method' => 'cryptomus',
                    'cryptomus_ref' => $result['uuid'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment initialized successfully',
                    'data' => [
                        'reference' => $reference,
                        'link' => $result['url'],
                    ],
                ];
            }

            Log::error('Cryptomus payment initialization failed', [
                'user_id' => $user->id,
                'response' => $data,
            ]);

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Payment initialization failed',
            ];
        } catch (\Exception $e) {
            Log::error('Cryptomus payment initialization error', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while initializing payment',
            ];
        }
    }

    /**
     * Verify a payment transaction
     */
    public function verifyPayment(string $uuid): array
    {
        $payload = [
            'uuid' => $uuid,
        ];

        $sign = $this->generateSignature($payload);

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'merchant' => $this->merchantId,
                'sign' => $sign,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment/info', $payload);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/payment/info',
                'POST',
                $response->status(),
                $responseTime
            );

            $data = $response->json();

            if ($response->successful() && isset($data['state']) && $data['state'] === 0) {
                $result = $data['result'];

                return [
                    'success' => true,
                    'data' => [
                        'status' => $result['payment_status'],
                        'order_id' => $result['order_id'],
                        'amount' => $result['payment_amount'],
                        'currency' => $result['currency'],
                        'uuid' => $result['uuid'],
                        'is_final' => $result['is_final'] ?? false,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Cryptomus verification error', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while verifying payment',
            ];
        }
    }

    /**
     * Verify payment by order_id (our reference)
     */
    public function verifyPaymentByReference(string $reference): array
    {
        $payload = [
            'order_id' => $reference,
        ];

        $sign = $this->generateSignature($payload);

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'merchant' => $this->merchantId,
                'sign' => $sign,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payment/info', $payload);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/payment/info',
                'POST',
                $response->status(),
                $responseTime
            );

            $data = $response->json();

            if ($response->successful() && isset($data['state']) && $data['state'] === 0) {
                $result = $data['result'];

                return [
                    'success' => true,
                    'data' => [
                        'status' => $result['payment_status'],
                        'order_id' => $result['order_id'],
                        'amount' => $result['payment_amount'],
                        'currency' => $result['currency'],
                        'uuid' => $result['uuid'],
                        'is_final' => $result['is_final'] ?? false,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Cryptomus verification by reference error', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while verifying payment',
            ];
        }
    }

    /**
     * Generate signature for Cryptomus API
     */
    protected function generateSignature(array $payload): string
    {
        $jsonPayload = json_encode($payload);
        $base64Payload = base64_encode($jsonPayload);

        return md5($base64Payload . $this->apiKey);
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
            'endpoint' => 'cryptomus:' . $endpoint,
            'method' => $method,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
