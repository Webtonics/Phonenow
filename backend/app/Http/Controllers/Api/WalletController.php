<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\FlutterwaveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WalletController extends Controller
{
    public function __construct(
        protected FlutterwaveService $flutterwaveService
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

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:100', 'max:1000000'],
        ]);

        // Automatically cancel any previous pending funding transactions
        // This prevents the user from being blocked by abandoned attempts
        Transaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('payment_method', 'flutterwave')
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        /*
        // Old blocking logic - removed to improve UX
        $hasPendingTransaction = Transaction::where('user_id', $user->id)
            ->where('type', 'credit')
            ->where('payment_method', 'flutterwave')
            ->where('status', 'pending')
            ->where('created_at', '>', now()->subHours(1))
            ->exists();

        if ($hasPendingTransaction) {
            return response()->json([
                'success' => false,
                'message' => 'You have a pending funding transaction. Please complete or wait for it to expire.',
            ], 400);
        }
        */

        $result = $this->flutterwaveService->initializePayment(
            $user,
            $validated['amount']
        );

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

        // Verify with Flutterwave
        $result = isset($validated['transaction_id'])
            ? $this->flutterwaveService->verifyPayment($validated['transaction_id'])
            : $this->flutterwaveService->verifyPaymentByReference($validated['reference']);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 400);
        }

        $paymentData = $result['data'];

        // Verify the payment details match
        if ($paymentData['tx_ref'] !== $transaction->reference) {
            Log::warning('Payment reference mismatch', [
                'expected' => $transaction->reference,
                'received' => $paymentData['tx_ref'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Reference mismatch.',
            ], 400);
        }

        // Check payment status
        if ($paymentData['status'] !== 'successful') {
            $transaction->update([
                'status' => 'failed',
                'flutterwave_ref' => $paymentData['flw_ref'] ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment was not successful.',
                'data' => [
                    'status' => 'failed',
                ],
            ], 400);
        }

        // Verify amount matches
        if ((float) $paymentData['amount'] !== (float) $transaction->amount) {
            Log::warning('Payment amount mismatch', [
                'expected' => $transaction->amount,
                'received' => $paymentData['amount'],
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

            // Update transaction
            $transaction->update([
                'status' => 'completed',
                'flutterwave_ref' => $paymentData['flw_ref'],
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
            ]);

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
     * Clear pending Flutterwave transactions (for testing/debugging)
     */
    public function clearPendingTransactions(Request $request): JsonResponse
    {
        $user = $request->user();

        $deleted = Transaction::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('payment_method', 'flutterwave')
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "Cleared {$deleted} pending transaction(s)",
            'data' => [
                'deleted' => $deleted,
            ],
        ]);
    }
}
