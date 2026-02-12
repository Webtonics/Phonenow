<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\Transaction;
use App\Services\FlutterwaveService;
use App\Services\CryptomusService;
use App\Services\KorapayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    public function __construct(
        protected FlutterwaveService $flutterwaveService,
        protected CryptomusService $cryptomusService,
        protected KorapayService $korapayService
    ) {}

    /**
     * Get wallet balance and recent transactions
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $recentTransactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => (float) $user->balance,
                'currency' => 'NGN',
                'recent_transactions' => $recentTransactions->map(fn($tx) => [
                    'id' => $tx->id,
                    'type' => $tx->type,
                    'amount' => (float) $tx->amount,
                    'status' => $tx->status,
                    'reference' => $tx->reference,
                    'description' => $tx->description,
                    'created_at' => $tx->created_at,
                ]),
            ],
        ]);
    }

    /**
     * Get paginated transaction history
     */
    public function transactions(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => ['sometimes', 'in:credit,debit'],
            'status' => ['sometimes', 'in:pending,completed,failed'],
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
        ]);

        $query = Transaction::where('user_id', $user->id);

        if (isset($validated['type'])) {
            $query->where('type', $validated['type']);
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
        ]);
    }

    /**
     * Initialize wallet funding
     */
    public function initializeFunding(Request $request): JsonResponse
    {
        $user = $request->user();

        $enabledGateways = $this->getEnabledGateways();

        // Get payment provider first for dynamic validation
        $provider = $request->input('payment_provider');

        // Dynamic minimum based on payment provider
        // Cryptomus receives USD amounts (converted on frontend), so minimum is lower
        $minAmount = ($provider === 'cryptomus') ? 1 : 2000;

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:' . $minAmount, 'max:1000000'],
            'payment_provider' => [
                'required',
                'string',
                function ($attribute, $value, $fail) use ($enabledGateways) {
                    if (!in_array($value, $enabledGateways)) {
                        $fail('The selected payment provider is not available.');
                    }
                },
            ],
        ]);

        $provider = $validated['payment_provider'];

        // Automatically expire any previous pending funding transactions for this provider
        // This prevents the user from being blocked by abandoned attempts
        Transaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('payment_method', $provider)
            ->where('status', 'pending')
            ->update(['status' => 'expired']);

        // Route to appropriate payment provider
        $result = match ($provider) {
            'flutterwave' => $this->flutterwaveService->initializePayment($user, $validated['amount']),
            'cryptomus' => $this->cryptomusService->initializePayment($user, $validated['amount'], 'NGN'),
            'korapay' => $this->korapayService->initializePayment($user, $validated['amount']),
        };

        if ($result['success']) {
            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'],
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => $result['message'],
        ], 400);
    }

    /**
     * Verify wallet funding payment
     */
    public function verifyFunding(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'reference' => ['required', 'string'],
            'transaction_id' => ['sometimes', 'string'],
        ]);

        // Find the transaction
        $transaction = Transaction::where('reference', $validated['reference'])
            ->where('user_id', $user->id)
            ->where('type', 'credit')
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found.',
            ], 404);
        }

        if ($transaction->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => 'Transaction already verified.',
                'data' => [
                    'status' => 'completed',
                    'amount' => (float) $transaction->amount,
                    'balance' => (float) $user->fresh()->balance,
                ],
            ]);
        }

        // Verify with appropriate payment provider
        $provider = $transaction->payment_method;

        $result = match ($provider) {
            'flutterwave' => isset($validated['transaction_id'])
                ? $this->flutterwaveService->verifyPayment($validated['transaction_id'])
                : $this->flutterwaveService->verifyPaymentByReference($validated['reference']),
            'cryptomus' => $this->cryptomusService->verifyPayment($transaction->cryptomus_ref),
            'korapay' => $this->korapayService->verifyPayment($transaction->korapay_ref),
            default => ['success' => false, 'message' => 'Unsupported payment provider'],
        };

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        $paymentData = $result['data'];

        // Verify the payment details match (provider-specific logic)
        $referenceField = match ($provider) {
            'flutterwave' => 'tx_ref',
            'cryptomus' => 'order_id',
            'korapay' => 'reference',
            default => null,
        };

        if ($referenceField && isset($paymentData[$referenceField]) && $paymentData[$referenceField] !== $transaction->reference) {
            Log::warning('Payment reference mismatch', [
                'provider' => $provider,
                'expected' => $transaction->reference,
                'received' => $paymentData[$referenceField],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Reference mismatch.',
            ], 400);
        }

        // Check payment status (provider-specific)
        $isSuccessful = match ($provider) {
            'flutterwave' => $paymentData['status'] === 'successful',
            'cryptomus' => in_array($paymentData['status'], ['paid', 'paid_over']),
            'korapay' => $paymentData['status'] === 'success',
            default => false,
        };

        if (!$isSuccessful) {
            $providerRefField = match ($provider) {
                'flutterwave' => 'flutterwave_ref',
                'cryptomus' => 'cryptomus_ref',
                'korapay' => 'korapay_ref',
                default => null,
            };

            $providerRefValue = match ($provider) {
                'flutterwave' => $paymentData['flw_ref'] ?? null,
                'cryptomus' => $paymentData['uuid'] ?? null,
                'korapay' => $paymentData['reference'] ?? null,
                default => null,
            };

            if ($providerRefField) {
                $transaction->update([
                    'status' => 'failed',
                    $providerRefField => $providerRefValue,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Payment was not successful.',
                'data' => [
                    'status' => 'failed',
                ],
            ], 400);
        }

        // Verify amount matches (handle different amount fields)
        $paidAmount = (float) $paymentData['amount'];
        $expectedAmount = (float) $transaction->amount;

        // For Cryptomus, convert USD back to NGN for comparison using live rate
        if ($provider === 'cryptomus') {
            $exchangeRate = app(\App\Services\ExchangeRateService::class)->getUsdToNgnRate();
            $paidAmount = $paidAmount * $exchangeRate; // Convert USD to NGN
        }

        if (abs($paidAmount - $expectedAmount) > 0.01) {
            Log::warning('Payment amount mismatch', [
                'provider' => $provider,
                'expected' => $expectedAmount,
                'received' => $paidAmount,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Amount mismatch.',
            ], 400);
        }

        DB::beginTransaction();

        try {
            $balanceBefore = $user->balance;

            // Credit user wallet
            $user->addBalance($transaction->amount);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Determine the provider reference field and value
            $providerRefField = match ($provider) {
                'flutterwave' => 'flutterwave_ref',
                'cryptomus' => 'cryptomus_ref',
                'korapay' => 'korapay_ref',
                default => null,
            };

            $providerRefValue = match ($provider) {
                'flutterwave' => $paymentData['flw_ref'] ?? null,
                'cryptomus' => $paymentData['uuid'] ?? null,
                'korapay' => $paymentData['reference'] ?? null,
                default => null,
            };

            // Update transaction
            $updateData = [
                'status' => 'completed',
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ];

            if ($providerRefField && $providerRefValue) {
                $updateData[$providerRefField] = $providerRefValue;
            }

            $transaction->update($updateData);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Payment verified successfully. Your wallet has been credited.',
                'data' => [
                    'status' => 'completed',
                    'amount' => (float) $transaction->amount,
                    'balance' => (float) $user->fresh()->balance,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to credit wallet after payment verification', [
                'user_id' => $user->id,
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while processing your payment. Please contact support.',
            ], 500);
        }
    }

    /**
     * Get transaction details
     */
    public function getTransaction(Request $request, string $reference): JsonResponse
    {
        $user = $request->user();

        $transaction = Transaction::where('reference', $reference)
            ->where('user_id', $user->id)
            ->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'amount' => (float) $transaction->amount,
                'balance_before' => (float) $transaction->balance_before,
                'balance_after' => (float) $transaction->balance_after,
                'status' => $transaction->status,
                'reference' => $transaction->reference,
                'description' => $transaction->description,
                'payment_method' => $transaction->payment_method,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
            ],
        ]);
    }

    /**
     * Get available payment methods for the user
     */
    public function getPaymentMethods(): JsonResponse
    {
        $methods = [];
        $gateways = [
            'flutterwave' => [
                'name' => 'Card Payment',
                'description' => 'Visa, Mastercard, Verve',
                'icon' => 'credit-card',
                'service' => $this->flutterwaveService,
            ],
            'cryptomus' => [
                'name' => 'Cryptocurrency',
                'description' => 'Bitcoin, USDT, Ethereum & more',
                'icon' => 'bitcoin',
                'service' => $this->cryptomusService,
            ],
            'korapay' => [
                'name' => 'Bank Transfer',
                'description' => 'Direct bank transfer, USSD',
                'icon' => 'globe',
                'service' => $this->korapayService,
            ],
        ];

        foreach ($gateways as $id => $gateway) {
            $isEnabled = (bool) Setting::getValue("gateway_{$id}_enabled", true);
            $isConfigured = $gateway['service']->isConfigured();

            if ($isEnabled && $isConfigured) {
                $methods[] = [
                    'id' => $id,
                    'name' => $gateway['name'],
                    'description' => $gateway['description'],
                    'icon' => $gateway['icon'],
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    /**
     * Get list of enabled payment gateways
     */
    private function getEnabledGateways(): array
    {
        $gateways = ['flutterwave', 'cryptomus', 'korapay'];
        $enabled = [];

        $services = [
            'flutterwave' => $this->flutterwaveService,
            'cryptomus' => $this->cryptomusService,
            'korapay' => $this->korapayService,
        ];

        foreach ($gateways as $gateway) {
            $isEnabled = (bool) Setting::getValue("gateway_{$gateway}_enabled", true);
            $isConfigured = $services[$gateway]->isConfigured();

            if ($isEnabled && $isConfigured) {
                $enabled[] = $gateway;
            }
        }

        return $enabled;
    }
}
