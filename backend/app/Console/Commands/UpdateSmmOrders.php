<?php

namespace App\Console\Commands;

use App\Models\SmmOrder;
use App\Services\SmmManager;
use Illuminate\Console\Command;

class UpdateSmmOrders extends Command
{
    protected $signature = 'smm:update-orders';
    protected $description = 'Update status of pending/processing SMM orders';

    public function handle(SmmManager $smmManager): int
    {
        $this->info('Updating SMM order statuses...');

        $orders = SmmOrder::processing()->get();

        if ($orders->isEmpty()) {
            $this->info('No orders to update');
            return self::SUCCESS;
        }

        $updated = 0;
        $failed = 0;

        foreach ($orders as $order) {
            if ($smmManager->updateOrderStatus($order)) {
                $updated++;
                $this->info("✓ Updated order {$order->reference} - Status: {$order->status}");
            } else {
                $failed++;
                $this->warn("✗ Failed to update order {$order->reference}");
            }
        }

        $this->info("\nTotal: {$orders->count()} | Updated: {$updated} | Failed: {$failed}");

        return self::SUCCESS;
    }
}
