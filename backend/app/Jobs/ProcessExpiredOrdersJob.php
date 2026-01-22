<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\Transaction;
use App\Services\FiveSimService;
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

    public function handle(FiveSimService $fiveSimService): void
    {
        // Find orders that might be expired
        $orders = Order::whereIn('status', ['pending', 'active'])
            ->where('type', 'phone')
            ->where('created_at', '<', now()->subMinutes(20))
            ->get();

        foreach ($orders as $order) {
            try {
                $this->processOrder($order, $fiveSimService);
            } catch (\Exception $e) {
                Log::error('Failed to process expired order', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    protected function processOrder(Order $order, FiveSimService $fiveSimService): void
    {
        // Check order status with 5SIM
        $result = $fiveSimService->checkOrder(
            $order->external_order_id,
            $order->user_id
        );

        if (!$result['success']) {
            Log::warning('Failed to check order status', [
                'order_id' => $order->id,
                'error' => $result['message'] ?? 'Unknown error',
            ]);
            return;
        }

        $orderData = $result['data'];
        $newStatus = FiveSimService::mapStatus($orderData['status']);

        // If order is expired or timed out
        if (in_array($newStatus, ['expired', 'cancelled'])) {
            DB::beginTransaction();

            try {
                $order->update([
                    'status' => 'expired',
                    'metadata' => array_merge($order->metadata ?? [], [
                        'expired_at' => now()->toISOString(),
                        'final_status' => $orderData['status'],
                    ]),
                ]);

                // Refund user if no SMS was received
                if (empty($orderData['sms'])) {
                    $user = $order->user;
                    $user->addBalance($order->price);

                    Transaction::create([
                        'user_id' => $user->id,
                        'type' => 'refund',
                        'amount' => $order->price,
                        'currency' => 'NGN',
                        'status' => 'completed',
                        'reference' => Transaction::generateReference(),
                        'description' => "Auto-refund for expired order: {$order->order_number}",
                        'payment_method' => 'wallet',
                        'metadata' => [
                            'order_id' => $order->id,
                            'order_number' => $order->order_number,
                            'reason' => 'order_expired',
                        ],
                    ]);

                    Log::info('Auto-refunded expired order', [
                        'order_id' => $order->id,
                        'user_id' => $user->id,
                        'amount' => $order->price,
                    ]);
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } else {
            // Just update the status
            $order->update([
                'status' => $newStatus,
                'metadata' => array_merge($order->metadata ?? [], [
                    'sms' => $orderData['sms'],
                    'last_checked' => now()->toISOString(),
                ]),
            ]);
        }
    }
}
