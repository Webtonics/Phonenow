<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class ExchangeRateService
{
    /**
     * Default fallback rate if not configured
     */
    protected const DEFAULT_RATE = 1600.0;

    /**
     * Get current USD to NGN exchange rate (manual only)
     *
     * This rate is used for converting API costs (in USD) to NGN for billing.
     * The rate must be set manually in admin settings.
     */
    public function getUsdToNgnRate(): float
    {
        $rate = (float) Setting::getValue('usd_to_ngn_rate', 0);

        if ($rate <= 0) {
            Log::warning('USD to NGN rate not configured, using default', [
                'default_rate' => self::DEFAULT_RATE,
            ]);
            return self::DEFAULT_RATE;
        }

        return $rate;
    }

    /**
     * Set the USD to NGN exchange rate
     */
    public function setRate(float $rate): void
    {
        if ($rate <= 0) {
            throw new \InvalidArgumentException('Exchange rate must be greater than 0');
        }

        Setting::setValue('usd_to_ngn_rate', $rate, 'float', 'pricing', 'USD to NGN exchange rate for phone number pricing');

        Log::info('USD to NGN exchange rate updated', ['rate' => $rate]);
    }

    /**
     * Check if the rate has been manually configured
     */
    public function isConfigured(): bool
    {
        $rate = (float) Setting::getValue('usd_to_ngn_rate', 0);
        return $rate > 0;
    }

    /**
     * Get exchange rate info for admin display
     */
    public function getRateInfo(): array
    {
        $rate = $this->getUsdToNgnRate();
        $isConfigured = $this->isConfigured();

        return [
            'rate' => $rate,
            'source' => $isConfigured ? 'manual' : 'default',
            'is_configured' => $isConfigured,
            'default_rate' => self::DEFAULT_RATE,
            'last_updated' => now()->toDateTimeString(),
        ];
    }

    /**
     * Get the default rate (for reference)
     */
    public function getDefaultRate(): float
    {
        return self::DEFAULT_RATE;
    }
}
