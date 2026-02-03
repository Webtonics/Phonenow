<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Transaction;
use App\Services\SmsProviderManager;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessExpiredOrdersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(SmsProviderManager $providerManager): void
    {
        // Find orders that might be expired across all providers
        $orders = Order::whereIn('status', ['pending', 'processing'])
            ->where('type', 'phone_number')
            ->where(function ($query) {
                $query->where('expires_at', '<', now())
                    ->orWhere('created_at', '<', now()->subMinutes(25));
            })
            ->get();

        foreach ($orders as $order) {
            try {
                $this->processOrder($order, $providerManager);
            } catch (\Exception $e) {
                Log::error('Failed to process expired order', [
                    'order_id' => $order->id,
                    'provider' => $order->provider,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    protected function processOrder(Order $order, SmsProviderManager $providerManager): void
    {
        $provider = $providerManager->getProviderForOrder($order);

        // Check order status with provider
        $result = $provider->checkOrder(
            $order->provider_order_id,
            $order->user_id
        );

        if (!$result->success) {
            Log::warning('Failed to check expired order status', [
                'order_id' => $order->id,
                'provider' => $order->provider,
            ]);
            return;
        }

        $newStatus = $result->mappedStatus;

        // If order is expired or cancelled
        if (in_array($newStatus, ['expired', 'cancelled'])) {
            $this->handleExpiredOrCancelled($order, $result);
        } else {
            // Update order with latest data
            $updateData = ['status' => $newStatus];

            if ($result->hasReceivedSms() && !empty($result->sms)) {
                $latestSms = end($result->sms);
                $updateData['sms_code'] = $latestSms->code;
                $updateData['sms_text'] = $latestSms->text;
            }

            $order->update($updateData);
        }
    }

    protected function handleExpiredOrCancelled(Order $order, $result): void
    {
        DB::beginTransaction();

        try {
            $order->update([
                'status' => 'expired',
                'provider_metadata' => array_merge(
                    $order->provider_metadata ?? [],
                    ['expired_at' => now()->toISOString()]
                ),
            ]);

            // Refund user if no SMS was received
            if (!$result->hasReceivedSms() && !$order->sms_code) {
                $user = $order->user;
                $balanceBefore = $user->balance;
                $user->addBalance($order->amount_paid);

                Transaction::create([
                    'user_id' => $user->id,
                    'type' => 'credit',
                    'amount' => $order->amount_paid,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $user->fresh()->balance,
                    'status' => 'completed',
                    'reference' => Transaction::generateReference(),
                    'description' => "Auto-refund for expired order: {$order->order_number}",
                    'payment_method' => 'refund',
                ]);

                Log::info('Auto-refunded expired order', [
                    'order_id' => $order->id,
                    'provider' => $order->provider,
                    'user_id' => $user->id,
                    'amount' => $order->amount_paid,
                ]);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
