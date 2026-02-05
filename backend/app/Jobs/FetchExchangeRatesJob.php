<?php

namespace App\Jobs;

use App\Services\ExchangeRateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FetchExchangeRatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * Execute the job.
     */
    public function handle(ExchangeRateService $exchangeRateService): void
    {
        Log::info('Starting exchange rate sync...');

        try {
            $exchangeRateService->updateExchangeRate();
            Log::info('Exchange rate sync completed successfully.');
        } catch (\Exception $e) {
            Log::error('Exchange rate sync failed: ' . $e->getMessage());
            // We don't rethrow because we don't want to retry indefinitely if the API is down,
            // the system will just use the last known rate or default.
        }
    }
}
