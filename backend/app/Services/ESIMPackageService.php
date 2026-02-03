<?php

namespace App\Services;

use App\Models\ESIMPackage;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;

class ESIMPackageService
{
    public function __construct(
        protected ZenditService $zenditService,
        protected ESIMPricingService $pricingService
    ) {}

    /**
     * Sync packages from Zendit API
     * Updates local database with latest offers and pricing
     * Uses chunked fetching to avoid timeouts
     */
    public function syncPackages(): array
    {
        set_time_limit(600); // 10 minutes for large datasets

        Log::info('Starting Zendit eSIM package sync');

        // Clear cache first to force fresh fetch
        $this->zenditService->clearCache();

        try {
            // Use chunked fetch with progress callback
            $result = $this->zenditService->getAllOffersChunked(function ($progress) {
                Log::info('Sync progress: Fetching offers', $progress);
            });

            if (!$result['success']) {
                return [
                    'success' => false,
                    'message' => 'Failed to fetch offers from Zendit: ' . ($result['message'] ?? 'Unknown error'),
                    'synced' => 0,
                ];
            }

            $offers = $result['data']['list'] ?? $result['data'] ?? [];

            if (!is_array($offers)) {
                Log::error('Zendit API returned invalid data', ['data' => $offers]);
                return [
                    'success' => false,
                    'message' => 'Invalid data received from Zendit. Expected array of offers.',
                    'synced' => 0,
                ];
            }

            if (empty($offers)) {
                return [
                    'success' => false,
                    'message' => 'No offers received from Zendit.',
                    'synced' => 0,
                ];
            }

            Log::info('Received offers from Zendit', ['count' => count($offers)]);

            $syncedCount = 0;
            $errors = [];
            $totalOffers = count($offers);

            foreach ($offers as $index => $offer) {
                if (!is_array($offer)) {
                    Log::warning('Skipping invalid offer at index ' . $index);
                    $errors[] = [
                        'offer' => 'index_' . $index,
                        'error' => 'Invalid offer data type',
                    ];
                    continue;
                }

                try {
                    $this->syncSingleOffer($offer);
                    $syncedCount++;

                    // Log progress every 50 packages
                    if ($syncedCount % 50 === 0) {
                        Log::info('Sync progress: Saving packages', [
                            'synced' => $syncedCount,
                            'total' => $totalOffers,
                            'percentage' => round(($syncedCount / $totalOffers) * 100, 1),
                        ]);
                    }
                } catch (\Exception $e) {
                    $errors[] = [
                        'offer' => $offer['offerId'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ];
                    Log::error('Failed to sync offer', [
                        'offerId' => $offer['offerId'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            Log::info('Zendit package sync completed', [
                'synced' => $syncedCount,
                'errors' => count($errors),
            ]);

            return [
                'success' => true,
                'message' => "Successfully synced {$syncedCount} packages from Zendit" .
                    (count($errors) > 0 ? " ({$errors} errors)" : ''),
                'synced' => $syncedCount,
                'total_fetched' => $totalOffers,
                'errors' => count($errors) > 10 ? array_slice($errors, 0, 10) : $errors,
                'from_cache' => $result['from_cache'] ?? false,
            ];

        } catch (\Exception $e) {
            Log::error('Zendit package sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
                'synced' => 0,
            ];
        }
    }

    /**
     * Sync a single offer from Zendit API data
     *
     * Zendit offer structure:
     * - offerId: unique identifier
     * - brand: provider brand name
     * - country: 2-letter ISO code
     * - durationDays: validity period
     * - dataGB: data amount in GB (or null if unlimited)
     * - dataUnlimited: boolean
     * - voiceMinutes: voice minutes (or null if unlimited)
     * - voiceUnlimited: boolean
     * - smsNumber: SMS count (or null if unlimited)
     * - smsUnlimited: boolean
     * - price: cost in USD
     * - priceCurrency: currency code
     * - regions: array of regions for roaming
     * - roaming: roaming info
     * - priceType: pricing type
     * - productType: product type
     */
    protected function syncSingleOffer(array $offer): void
    {
        $offerId = $offer['offerId'];
        $priceUsd = (float) ($offer['price'] ?? 0);

        // Determine package type - Zendit doesn't have explicit profile/topup distinction
        // We'll treat all as 'profile' since they're new eSIM purchases
        $packageType = 'profile';

        // Calculate selling price
        $pricing = $this->pricingService->calculateProfilePrice($priceUsd);

        // Convert data GB to MB for backward compatibility
        $dataGb = $offer['dataGB'] ?? null;
        $dataMb = $dataGb ? $dataGb * 1024 : 0;

        // Extract data speeds from the offer
        $dataSpeeds = $offer['dataSpeeds'] ?? null;
        if (is_string($dataSpeeds)) {
            $dataSpeeds = [$dataSpeeds];
        }

        // Determine region from offer or country
        $region = $this->determineRegion($offer);

        // Get country name
        $countryCode = strtoupper($offer['country'] ?? '');
        $countryName = $this->zenditService->getCountryName($countryCode);

        ESIMPackage::updateOrCreate(
            ['offer_id' => $offerId],
            [
                // Also store as package_code for backward compatibility
                'package_code' => $offerId,
                'brand' => $offer['brand'] ?? null,
                'country_code' => $countryCode,
                'country_name' => $countryName,
                'region' => $region,
                'regions' => $offer['regions'] ?? null,

                // Data
                'data_amount' => $dataMb,
                'data_gb' => $dataGb,
                'data_unlimited' => (bool) ($offer['dataUnlimited'] ?? false),
                'duration_days' => (int) ($offer['durationDays'] ?? 0),
                'network_type' => is_array($dataSpeeds) ? implode('/', $dataSpeeds) : ($dataSpeeds ?? '4G'),
                'data_speeds' => $dataSpeeds,

                // Voice & SMS
                'voice_minutes' => $offer['voiceMinutes'] ?? null,
                'voice_unlimited' => (bool) ($offer['voiceUnlimited'] ?? false),
                'sms_number' => $offer['smsNumber'] ?? null,
                'sms_unlimited' => (bool) ($offer['smsUnlimited'] ?? false),

                // Roaming
                'roaming_countries' => $offer['roaming'] ?? null,

                // Pricing
                'price_usd' => $priceUsd,
                'price_currency' => $offer['priceCurrency'] ?? 'USD',
                'wholesale_price' => $pricing['wholesale_ngn'],
                'selling_price' => $pricing['selling_ngn'],
                'markup_percentage' => $pricing['markup_percentage'],

                // Classification
                'package_type' => $packageType,
                'price_type' => $offer['priceType'] ?? null,
                'product_type' => $offer['productType'] ?? null,
                'provider' => 'zendit',

                // Status
                'is_active' => true,
                'last_synced_at' => now(),
            ]
        );
    }

    /**
     * Determine region from offer data or country code
     */
    protected function determineRegion(array $offer): ?string
    {
        // Check if Zendit provides region directly
        if (!empty($offer['region'])) {
            return $offer['region'];
        }

        // Check if regions array is provided
        if (!empty($offer['regions']) && is_array($offer['regions'])) {
            // Return first region or 'Global' if multiple
            return count($offer['regions']) > 1 ? 'Global' : $offer['regions'][0];
        }

        // Fallback: determine from country code
        $countryCode = strtoupper($offer['country'] ?? '');
        return $this->getRegionFromCountry($countryCode);
    }

    /**
     * Get region from country code
     */
    protected function getRegionFromCountry(string $countryCode): ?string
    {
        $regionMap = [
            'Europe' => ['GB', 'FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT', 'PT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'CZ', 'GR', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY'],
            'Asia' => ['CN', 'JP', 'KR', 'SG', 'TH', 'MY', 'VN', 'PH', 'ID', 'IN', 'HK', 'TW', 'MM', 'KH', 'LA', 'BD', 'PK', 'LK', 'NP'],
            'North America' => ['US', 'CA', 'MX'],
            'South America' => ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY'],
            'Middle East' => ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB', 'TR'],
            'Africa' => ['NG', 'ZA', 'EG', 'KE', 'GH', 'MA', 'TN', 'TZ', 'UG', 'ET', 'SN'],
            'Oceania' => ['AU', 'NZ', 'FJ', 'PG'],
            'Caribbean' => ['JM', 'DO', 'PR', 'CU', 'HT', 'TT', 'BB', 'BS'],
            'Central America' => ['GT', 'PA', 'CR', 'HN', 'SV', 'NI', 'BZ'],
        ];

        foreach ($regionMap as $region => $countries) {
            if (in_array($countryCode, $countries)) {
                return $region;
            }
        }

        return null;
    }

    /**
     * Get all active packages with filters
     */
    public function getActivePackages(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = ESIMPackage::active()->zendit();

        if (isset($filters['country'])) {
            $query->country($filters['country']);
        }

        if (isset($filters['region'])) {
            $query->region($filters['region']);
        }

        if (isset($filters['type'])) {
            $query->type($filters['type']);
        }

        if (isset($filters['search'])) {
            $query->search($filters['search']);
        }

        // Filter by features
        if (isset($filters['has_voice']) && $filters['has_voice']) {
            $query->withVoice();
        }

        if (isset($filters['has_sms']) && $filters['has_sms']) {
            $query->withSms();
        }

        // Sort
        if (isset($filters['sort'])) {
            switch ($filters['sort']) {
                case 'popular':
                    $query->orderByPopularity();
                    break;
                case 'price_high':
                    $query->orderBy('selling_price', 'desc');
                    break;
                case 'data':
                    $query->orderBy('data_gb', 'desc');
                    break;
                default:
                    $query->orderBy('selling_price', 'asc');
            }
        } else {
            $query->orderBy('selling_price', 'asc');
        }

        return $query->get();
    }

    /**
     * Get popular packages
     */
    public function getPopularPackages(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return ESIMPackage::active()
            ->zendit()
            ->popular()
            ->orderByPopularity()
            ->limit($limit)
            ->get();
    }

    /**
     * Get packages by country
     */
    public function getPackagesByCountry(string $countryCode): \Illuminate\Database\Eloquent\Collection
    {
        return ESIMPackage::active()
            ->zendit()
            ->country($countryCode)
            ->orderBy('selling_price', 'asc')
            ->get();
    }

    /**
     * Get available countries
     */
    public function getAvailableCountries(): array
    {
        $countries = ESIMPackage::active()
            ->zendit()
            ->select('country_code', 'country_name')
            ->distinct()
            ->orderBy('country_name')
            ->get();

        return $countries->map(fn($pkg) => [
            'code' => $pkg->country_code,
            'name' => $pkg->country_name,
            'flag' => $this->zenditService->getCountryFlag($pkg->country_code),
        ])->toArray();
    }

    /**
     * Get available regions
     */
    public function getAvailableRegions(): array
    {
        return ESIMPackage::active()
            ->zendit()
            ->whereNotNull('region')
            ->distinct()
            ->pluck('region')
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Mark package as popular
     */
    public function markAsPopular(int $packageId): void
    {
        ESIMPackage::find($packageId)?->update(['is_popular' => true]);
    }

    /**
     * Update package pricing
     */
    public function updatePackagePricing(int $packageId, float $newMarkup): array
    {
        $package = ESIMPackage::find($packageId);

        if (!$package) {
            return [
                'success' => false,
                'message' => 'Package not found',
            ];
        }

        // Recalculate with new markup using USD price
        $priceUsd = $package->price_usd ?? ($package->wholesale_price / $this->pricingService->getMarkupSettings()['exchange_rate']);

        $pricing = $this->pricingService->calculateProfilePrice($priceUsd);

        $package->update([
            'selling_price' => $pricing['wholesale_ngn'] * (1 + ($newMarkup / 100)),
            'markup_percentage' => $newMarkup,
        ]);

        return [
            'success' => true,
            'message' => 'Pricing updated',
            'data' => $package->fresh(),
        ];
    }

    /**
     * Recalculate all package prices (e.g., after exchange rate change)
     */
    public function recalculateAllPrices(): array
    {
        $packages = ESIMPackage::active()->zendit()->get();
        $updated = 0;

        foreach ($packages as $package) {
            if ($package->price_usd) {
                $pricing = $this->pricingService->calculateProfilePrice($package->price_usd);
                $package->update([
                    'wholesale_price' => $pricing['wholesale_ngn'],
                    'selling_price' => $pricing['selling_ngn'],
                ]);
                $updated++;
            }
        }

        return [
            'success' => true,
            'message' => "Recalculated prices for {$updated} packages",
            'updated' => $updated,
        ];
    }

    /**
     * Get package statistics
     */
    public function getStatistics(): array
    {
        return [
            'total_packages' => ESIMPackage::zendit()->count(),
            'active_packages' => ESIMPackage::active()->zendit()->count(),
            'countries_count' => ESIMPackage::active()->zendit()->distinct('country_code')->count('country_code'),
            'regions_count' => ESIMPackage::active()->zendit()->whereNotNull('region')->distinct('region')->count('region'),
            'popular_packages' => ESIMPackage::zendit()->popular()->count(),
            'total_purchases' => ESIMPackage::zendit()->sum('purchase_count'),
            'packages_with_voice' => ESIMPackage::active()->zendit()->withVoice()->count(),
            'packages_with_sms' => ESIMPackage::active()->zendit()->withSms()->count(),
        ];
    }

    /**
     * Get package by offer ID
     */
    public function getPackageByOfferId(string $offerId): ?ESIMPackage
    {
        return ESIMPackage::where('offer_id', $offerId)->first();
    }
}
