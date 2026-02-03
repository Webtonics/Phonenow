<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\SmsProviderManager;
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

    public function handle(SmsProviderManager $providerManager): void
    {
        // Skip if order is not in pollable state
        if (!in_array($this->order->status, ['pending', 'processing'])) {
            return;
        }

        // Check if order is expired
        if ($this->order->isExpired()) {
            $this->handleExpiredOrder($providerManager);
            return;
        }

        // Get the correct provider for this order
        $provider = $providerManager->getProviderForOrder($this->order);

        $result = $provider->checkOrder(
            $this->order->provider_order_id,
            $this->order->user_id
        );

        if (!$result->success) {
            Log::warning('Failed to poll SMS for order', [
                'order_id' => $this->order->id,
                'provider' => $provider->getIdentifier(),
                'error' => $result->errorMessage,
            ]);

            $this->scheduleNextPoll();
            return;
        }

        // Update order with new data
        $updateData = ['status' => $result->mappedStatus];

        if ($result->hasReceivedSms() && !empty($result->sms)) {
            $latestSms = end($result->sms);
            $updateData['sms_code'] = $latestSms->code;
            $updateData['sms_text'] = $latestSms->text;
        }

        $this->order->update($updateData);

        // Continue polling if still active
        if (in_array($result->mappedStatus, ['pending', 'processing'])) {
            $this->scheduleNextPoll();
        }
    }

    protected function scheduleNextPoll(): void
    {
        if ($this->order->fresh()->isExpired()) {
            return;
        }

        $interval = config('sms.polling.interval_seconds', 15);

        self::dispatch($this->order->fresh())
            ->delay(now()->addSeconds($interval));
    }

    protected function handleExpiredOrder(SmsProviderManager $providerManager): void
    {
        $this->order->update(['status' => 'expired']);

        // Try to cancel with provider
        try {
            $provider = $providerManager->getProviderForOrder($this->order);
            $provider->cancelOrder($this->order->provider_order_id, $this->order->user_id);
        } catch (\Exception $e) {
            Log::warning('Failed to cancel expired order with provider', [
                'order_id' => $this->order->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Dispatch job to handle refund if needed
        if (!$this->order->sms_code) {
            ProcessExpiredOrdersJob::dispatch();
        }
    }
}
