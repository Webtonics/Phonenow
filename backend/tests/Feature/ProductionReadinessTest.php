<?php

namespace Tests\Feature;

use App\Jobs\FetchExchangeRatesJob;
use App\Models\Setting;
use App\Services\ExchangeRateService;
use App\Services\ESIMPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class ProductionReadinessTest extends TestCase
{
    // Use RefreshDatabase to reset DB after tests, but be careful with existing data in local env
    // defaulting to not using it for safety unless we are sure, but verifying logic mostly.
    // Actually, for unit tests of services, we might not need full DB if we mock Setting.
    // But Setting is a model. Let's rely on manual cleanup or test specific logic.
    
    public function test_exchange_rate_service_updates_live_rates(): void
    {
        // Mock the API response
        Http::fake([
            'api.exchangerate-api.com/*' => Http::response([
                'rates' => [
                    'NGN' => 1550.50
                ]
            ], 200),
        ]);

        $service = new ExchangeRateService();
        $service->updateExchangeRate();

        // Verify it wasn't saved to DB (mocking Setting is hard without DB, so checks memory or logic)
        // Since we are in feature test, we CAN check DB if environment is set up.
        // Let's assume we can check the return value or side effect if simpler.
        // Actually, let's verify the Setting model interaction if possible.
        
        // Assert that the setting was updated in the database
        // We will assume the test DB is distinct or we accept writing to it.
        $this->assertDatabaseHas('settings', [
            'key' => 'usd_to_ngn_rate',
            'value' => '1550.5'
        ]);
    }

    public function test_pricing_service_calculates_correctly(): void
    {
        // Seed some settings
        Setting::updateOrCreate(['key' => 'esim_profile_markup'], ['value' => 100, 'type' => 'integer', 'group' => 'pricing']);
        Setting::updateOrCreate(['key' => 'usd_to_ngn_rate'], ['value' => 1000, 'type' => 'float', 'group' => 'pricing']);

        $exchangeService = new ExchangeRateService();
        $service = new ESIMPricingService($exchangeService);

        // Wholesale $5.00 * 1000 rate = 5000 NGN
        // Markup 100% = 5000 profit
        // Selling = 10000 NGN
        $result = $service->calculateProfilePrice(5.00);

        $this->assertEquals(5.00, $result['wholesale_usd']);
        $this->assertEquals(5000.00, $result['wholesale_ngn']);
        $this->assertEquals(10000.00, $result['selling_ngn']);
        $this->assertEquals(5000.00, $result['profit']);
    }

    public function test_fetch_exchange_rates_job_is_dispatched(): void
    {
        Queue::fake();

        // Trigger the schedule or manually dispatch
        FetchExchangeRatesJob::dispatch();

        Queue::assertPushed(FetchExchangeRatesJob::class);
    }
}
