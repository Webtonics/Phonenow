<?php

namespace App\Jobs;

use App\Models\ESIMPackage;
use App\Models\Setting;
use App\Services\ESIMAccessService;
use App\Services\ESIMPricingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncESimPackagesJob implements ShouldQueue
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
    public function handle(
        ESIMAccessService $esimAccessService,
        ESIMPricingService $pricingService
    ): void {
        if (!Setting::isEsimAutoSyncEnabled()) {
            Log::info('eSIM package sync skipped (disabled in settings)');
            return;
        }

        Log::info('Starting eSIM package sync...');

        try {
            $response = $esimAccessService->getPackages();

            if (!$response['success'] || empty($response['data'])) {
                Log::error('eSIM package sync failed to retrieve data', [
                    'message' => $response['message'] ?? 'Unknown error'
                ]);
                return;
            }

            $packages = $response['data'];
            $count = 0;
            $updated = 0;

            foreach ($packages as $pkg) {
                // Map API fields to Model fields
                // Note: Adjust field mapping based on actual API response structure
                $packageCode = $pkg['packageCode'] ?? null;
                
                if (!$packageCode) continue;

                $wholesalePrice = (float) ($pkg['price'] ?? 0);
                
                // Calculate selling price
                $pricing = $pricingService->calculateProfilePrice($wholesalePrice);
                
                $data = [
                    'package_code' => $packageCode,
                    'offer_id' => $pkg['offerId'] ?? null,
                    'brand' => $pkg['brand'] ?? 'eSIM',
                    'country_code' => $pkg['countryCode'] ?? null,
                    'country_name' => $pkg['countryName'] ?? null,
                    'region' => $pkg['region'] ?? null,
                    'data_amount' => $this->parseDataAmount($pkg['dataAmount'] ?? 0),
                    'data_gb' => $this->parseDataGb($pkg['dataAmount'] ?? 0),
                    'duration_days' => (int) ($pkg['duration'] ?? 0),
                    'network_type' => $pkg['networkType'] ?? '4G',
                    'data_speeds' => $pkg['speed'] ?? ['4G'],
                    'wholesale_price' => $wholesalePrice,
                    'price_usd' => $wholesalePrice,
                    'price_currency' => 'USD',
                    'selling_price' => $pricing['selling_ngn'],
                    'markup_percentage' => $pricing['markup_percentage'],
                    'package_type' => 'profile',
                    'provider' => 'esim_access',
                    'is_active' => true,
                    'last_synced_at' => now(),
                ];

                $esimPackage = ESIMPackage::updateOrCreate(
                    ['package_code' => $packageCode],
                    $data
                );
                
                if ($esimPackage->wasRecentlyCreated) {
                    $count++;
                } else {
                    $updated++;
                }
            }

            Log::info("eSIM package sync completed. Created: $count, Updated: $updated");

        } catch (\Exception $e) {
            Log::error('eSIM package sync failed: ' . $e->getMessage());
            throw $e;
        }
    }

    private function parseDataAmount($amount): float
    {
        // Logic to parse "1GB" or "500MB" to MB
        // Simplified for now, assuming API returns MB or simple string
        return (float) $amount; 
    }

    private function parseDataGb($amount): float
    {
        // Logic to parse to GB
        return (float) $amount / 1024;
    }
}
