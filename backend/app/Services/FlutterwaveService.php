<?php

namespace App\Services;

use App\Models\ApiLog;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlutterwaveService
{
    protected string $baseUrl = 'https://api.flutterwave.com/v3';
    protected string $secretKey;
    protected string $publicKey;

    public function __construct()
    {
        $this->secretKey = config('services.flutterwave.secret_key');
        $this->publicKey = config('services.flutterwave.public_key');
    }

    /**
     * Initialize a payment transaction
     */
    public function initializePayment(User $user, float $amount, string $currency = 'NGN'): array
    {
        $reference = Transaction::generateReference();

        $payload = [
            'tx_ref' => $reference,
            'amount' => $amount,
            'currency' => $currency,
            'redirect_url' => config('app.frontend_url') . '/wallet/success',
            'customer' => [
                'email' => $user->email,
                'name' => $user->name,
                'phonenumber' => $user->phone,
            ],
            'customizations' => [
                'title' => 'PhoneNow Wallet Funding',
                'description' => 'Add funds to your PhoneNow wallet',
                'logo' => config('app.url') . '/logo.png',
            ],
            'meta' => [
                'user_id' => $user->id,
            ],
        ];

        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/payments', $payload);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/payments',
                'POST',
                $response->status(),
                $responseTime,
                $user->id
            );

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] === 'success') {
                // Create pending transaction
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $amount,
                    'balance_before' => $user->balance,
                    'balance_after' => $user->balance,
                    'description' => 'Wallet funding via Flutterwave',
                    'status' => 'pending',
                    'reference' => $reference,
                    'payment_method' => 'flutterwave',
                    'flutterwave_ref' => $data['data']['flw_ref'] ?? null,
                ]);

                return [
                    'success' => true,
                    'message' => 'Payment initialized successfully',
                    'data' => [
                        'reference' => $reference,
                        'link' => $data['data']['link'],
                    ],
                ];
            }

            Log::error('Flutterwave payment initialization failed', [
                'user_id' => $user->id,
                'response' => $data,
            ]);

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Payment initialization failed',
            ];
        } catch (\Exception $e) {
            Log::error('Flutterwave payment initialization error', [
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
    public function verifyPayment(string $transactionId): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/transactions/' . $transactionId . '/verify');

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/transactions/' . $transactionId . '/verify',
                'GET',
                $response->status(),
                $responseTime
            );

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] === 'success') {
                $txData = $data['data'];

                return [
                    'success' => true,
                    'data' => [
                        'status' => $txData['status'],
                        'tx_ref' => $txData['tx_ref'],
                        'amount' => $txData['amount'],
                        'currency' => $txData['currency'],
                        'flw_ref' => $txData['flw_ref'],
                        'transaction_id' => $txData['id'],
                        'customer_email' => $txData['customer']['email'] ?? null,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Flutterwave verification error', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'An error occurred while verifying payment',
            ];
        }
    }

    /**
     * Verify payment by reference (tx_ref)
     */
    public function verifyPaymentByReference(string $reference): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->secretKey,
            ])->get($this->baseUrl . '/transactions/verify_by_reference', [
                'tx_ref' => $reference,
            ]);

            $responseTime = (int) ((microtime(true) - $startTime) * 1000);

            // Log API call
            $this->logApiCall(
                '/transactions/verify_by_reference',
                'GET',
                $response->status(),
                $responseTime
            );

            $data = $response->json();

            if ($response->successful() && isset($data['status']) && $data['status'] === 'success') {
                $txData = $data['data'];

                return [
                    'success' => true,
                    'data' => [
                        'status' => $txData['status'],
                        'tx_ref' => $txData['tx_ref'],
                        'amount' => $txData['amount'],
                        'currency' => $txData['currency'],
                        'flw_ref' => $txData['flw_ref'],
                        'transaction_id' => $txData['id'],
                        'customer_email' => $txData['customer']['email'] ?? null,
                    ],
                ];
            }

            return [
                'success' => false,
                'message' => $data['message'] ?? 'Verification failed',
            ];
        } catch (\Exception $e) {
            Log::error('Flutterwave verification by reference error', [
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
            'endpoint' => 'flutterwave:' . $endpoint,
            'method' => $method,
            'status_code' => $statusCode,
            'response_time_ms' => $responseTime,
            'ip_address' => request()->ip(),
            'created_at' => now(),
        ]);
    }
}
