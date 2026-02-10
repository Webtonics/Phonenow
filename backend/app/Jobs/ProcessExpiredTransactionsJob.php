<?php

namespace App\Jobs;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessExpiredTransactionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(): void
    {
        $expiryMinutes = config('transaction.expiry_minutes', 60);

        // Find pending wallet funding transactions older than expiry time
        $expiredTransactions = Transaction::where('status', 'pending')
            ->where('type', 'credit')
            ->whereIn('payment_method', ['flutterwave', 'cryptomus', 'korapay'])
            ->where('created_at', '<', now()->subMinutes($expiryMinutes))
            ->get();

        foreach ($expiredTransactions as $transaction) {
            try {
                $transaction->update([
                    'status' => 'expired',
                    'description' => $transaction->description . ' (Auto-expired)',
                ]);

                Log::info('Auto-expired pending transaction', [
                    'transaction_id' => $transaction->id,
                    'user_id' => $transaction->user_id,
                    'payment_method' => $transaction->payment_method,
                    'amount' => $transaction->amount,
                    'age_minutes' => now()->diffInMinutes($transaction->created_at),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to expire transaction', [
                    'transaction_id' => $transaction->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        if ($expiredTransactions->count() > 0) {
            Log::info('Expired transactions processed', [
                'count' => $expiredTransactions->count(),
            ]);
        }
    }
}
