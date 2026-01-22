<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\FiveSimService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PollSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;

    public function __construct(
        public Order $order
    ) {}

    public function handle(FiveSimService $fiveSimService): void
    {
        // Skip if order is not in pollable state
        if (!in_array($this->order->status, ['pending', 'active'])) {
            return;
        }

        // Check order status with 5SIM
        $result = $fiveSimService->checkOrder(
            $this->order->external_order_id,
            $this->order->user_id
        );

        if (!$result['success']) {
            Log::warning('Failed to poll SMS for order', [
                'order_id' => $this->order->id,
                'error' => $result['message'] ?? 'Unknown error',
            ]);
            return;
        }

        $orderData = $result['data'];
        $newStatus = FiveSimService::mapStatus($orderData['status']);

        // Update order with new data
        $this->order->update([
            'status' => $newStatus,
            'metadata' => array_merge($this->order->metadata ?? [], [
                'sms' => $orderData['sms'],
                'last_polled' => now()->toISOString(),
            ]),
        ]);

        // If order is still active/pending and not expired, schedule another poll
        if (in_array($newStatus, ['pending', 'active'])) {
            $expiresAt = $this->order->metadata['expires'] ?? null;

            if ($expiresAt && now()->lt($expiresAt)) {
                // Poll again in 15 seconds
                self::dispatch($this->order->fresh())
                    ->delay(now()->addSeconds(15));
            }
        }
    }
}
