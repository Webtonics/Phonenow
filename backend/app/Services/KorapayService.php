<?php

namespace App\Services;

use App\Models\ApiLog;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class KorapayService
{
    protected string $baseUrl;
    protected string $secretKey;
    protected string $publicKey;
    protected string $encryptionKey;

    public function __construct()
    {
        $this->baseUrl = config('services.korapay.base_url') ?? 'https://api.korapay.com/merchant/api/v1';
        $this->secretKey = config('services.korapay.secret_key') ?? '';
        $this->publicKey = config('services.korapay.public_key') ?? '';
        $this->encryptionKey = config('services.korapay.encryption_key') ?? '';
    }

    public function isConfigured(): bool
    {
        return !empty($this->secretKey) && !empty($this->publicKey);
    }

    /**
     * Initialize a payment transaction
     */
    public function initializePayment(User $user, float $amount, string $currency = 'NGN'): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Korapay payment gateway is not configured',
            ];
        }

        $reference = Transaction::generateReference();

        $payload = [
            'reference' => $reference,
            'amount' => $amount,
            'currency' => $currency,
            'redirect_url' => config('app.frontend_url') . '/wallet/success',
            'notification_url' => config('app.url') . '/api/webhooks/korapay',
            'customer' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'metadata' => [
                'user_id' => $user->id,
            ],
            'channels' => ['card', 'bank_transfer', 'mobile_money'],
            'default_channel' => 'card',
        ];

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/charges/initialize', $payload);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/charges/initialize',
                'POST',
                $response->status(),
                $responseTime,
                $user->id
            );

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] === true) {
                $result = $data['data'];

                // Create pending transaction
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $user->balance,
                    'balance_after' => $user->balance,
                    'description' => 'Wallet funding via bank transfer',
                    'status' => 'pending',
                    'reference' => $reference,
                    'payment_method' => 'korapay',
                    'korapay_ref' => $result['reference'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment initialized successfully',
                    'data' => [
                        'reference' => $reference,
                        'link' => $result['checkout_url'],
                    ],
                ];
            }

            Log::error('Korapay payment initialization failed', [
                'user_id' => $user->id,
                'response' => $data,
            ]);

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Payment initialization failed',
            ];
        } catch (\Exception $e) {
            Log::error('Korapay payment initialization error', [
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
    public function verifyPayment(string $reference): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/charges/' . $reference);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/charges/' . $reference,
                'GET',
                $response->status(),
                $responseTime
            );

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] === true) {
                $result = $data['data'];

                return [
                    'success' => true,
                    'data' => [
                        'status' => $result['status'],
                        'reference' => $result['reference'],
                        'amount' => $result['amount'],
                        'currency' => $result['currency'],
                        'customer_email' => $result['customer']['email'] ?? null,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Korapay verification error', [
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
     * Verify payment by reference (same as verifyPayment for Korapay)
     */
    public function verifyPaymentByReference(string $reference): array
    {
        return $this->verifyPayment($reference);
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
            'endpoint' => 'korapay:' . $endpoint,
            'method' => $method,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
