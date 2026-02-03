<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class ESIMPricingService
{
    public function __construct(
        protected ExchangeRateService $exchangeRateService
    ) {}

    /**
     * Calculate selling price for eSIM profile
     *
     * @param float $wholesalePriceUsd Wholesale price in USD from eSIM Access API
     * @return array ['wholesale_ngn', 'selling_ngn', 'markup', 'profit']
     */
    public function calculateProfilePrice(float $wholesalePriceUsd): array
    {
        $exchangeRate = $this->exchangeRateService->getUsdToNgnRate();
        $markup = Setting::getEsimProfileMarkup();

        $wholesaleNgn = $wholesalePriceUsd * $exchangeRate;
        $sellingNgn = $wholesaleNgn * (1 + ($markup / 100));
        $profit = $sellingNgn - $wholesaleNgn;

        Log::info('eSIM Profile Price Calculated', [
            'wholesale_usd' => $wholesalePriceUsd,
            'exchange_rate' => $exchangeRate,
            'wholesale_ngn' => $wholesaleNgn,
            'markup' => $markup,
            'selling_ngn' => $sellingNgn,
            'profit' => $profit,
        ]);

        return [
            'wholesale_usd' => round($wholesalePriceUsd, 2),
            'wholesale_ngn' => round($wholesaleNgn, 2),
            'selling_ngn' => round($sellingNgn, 2),
            'markup_percentage' => $markup,
            'profit' => round($profit, 2),
            'exchange_rate' => $exchangeRate,
        ];
    }

    /**
     * Calculate selling price for data bundle
     *
     * @param float $wholesalePriceUsd Wholesale price in USD from eSIM Access API
     * @return array ['wholesale_ngn', 'selling_ngn', 'markup', 'profit']
     */
    public function calculateDataBundlePrice(float $wholesalePriceUsd): array
    {
        $exchangeRate = $this->exchangeRateService->getUsdToNgnRate();
        $markup = Setting::getEsimDataMarkup();

        $wholesaleNgn = $wholesalePriceUsd * $exchangeRate;
        $sellingNgn = $wholesaleNgn * (1 + ($markup / 100));
        $profit = $sellingNgn - $wholesaleNgn;

        Log::info('eSIM Data Bundle Price Calculated', [
            'wholesale_usd' => $wholesalePriceUsd,
            'exchange_rate' => $exchangeRate,
            'wholesale_ngn' => $wholesaleNgn,
            'markup' => $markup,
            'selling_ngn' => $sellingNgn,
            'profit' => $profit,
        ]);

        return [
            'wholesale_usd' => round($wholesalePriceUsd, 2),
            'wholesale_ngn' => round($wholesaleNgn, 2),
            'selling_ngn' => round($sellingNgn, 2),
            'markup_percentage' => $markup,
            'profit' => round($profit, 2),
            'exchange_rate' => $exchangeRate,
        ];
    }

    /**
     * Get current markup settings
     */
    public function getMarkupSettings(): array
    {
        return [
            'profile_markup' => Setting::getEsimProfileMarkup(),
            'data_markup' => Setting::getEsimDataMarkup(),
            'exchange_rate' => $this->exchangeRateService->getUsdToNgnRate(),
            'min_purchase_amount' => (float) Setting::getValue('esim_min_purchase_amount', 1000),
        ];
    }

    /**
     * Update profile markup percentage
     */
    public function updateProfileMarkup(float $percentage): void
    {
        Setting::setValue('esim_profile_markup', $percentage, 'float', 'pricing',
            'Markup percentage for eSIM profiles');
    }

    /**
     * Update data bundle markup percentage
     */
    public function updateDataMarkup(float $percentage): void
    {
        Setting::setValue('esim_data_markup', $percentage, 'float', 'pricing',
            'Markup percentage for eSIM data bundles');
    }

    /**
     * Format price for display
     */
    public function formatPrice(float $amount): string
    {
        return '₦' . number_format($amount, 2);
    }

    /**
     * Get recommended markup based on wholesale price
     * Higher wholesale prices get lower markup percentages
     */
    public function getRecommendedMarkup(float $wholesalePriceUsd, string $type = 'data'): float
    {
        $defaultMarkup = $type === 'profile'
            ? Setting::getEsimProfileMarkup()
            : Setting::getEsimDataMarkup();

        // For expensive packages, reduce markup to stay competitive
        if ($wholesalePriceUsd > 50) {
            return max($defaultMarkup * 0.7, 50); // At least 50% markup
        } elseif ($wholesalePriceUsd > 20) {
            return max($defaultMarkup * 0.85, 80); // At least 80% markup
        }

        return $defaultMarkup;
    }
}
