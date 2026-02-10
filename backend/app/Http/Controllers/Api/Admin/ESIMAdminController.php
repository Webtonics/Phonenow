<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ESIMPackage;
use App\Models\ESIMProfile;
use App\Models\ESIMSubscription;
use App\Models\Setting;
use App\Services\ESIMPackageService;
use App\Services\ESIMPricingService;
use App\Services\ESIMPurchaseService;
use App\Services\ZenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ESIMAdminController extends Controller
{
    public function __construct(
        protected ZenditService $zenditService,
        protected ESIMPackageService $packageService,
        protected ESIMPricingService $pricingService,
        protected ESIMPurchaseService $purchaseService
    ) {}

    /**
     * Get eSIM dashboard statistics
     * GET /api/admin/esim/stats
     */
    public function stats(): JsonResponse
    {
        $packageStats = $this->packageService->getStatistics();

        // Return flat structure expected by frontend
        $stats = [
            // Package stats (expected by frontend)
            'total_packages' => $packageStats['total_packages'] ?? 0,
            'active_packages' => $packageStats['active_packages'] ?? 0,
            'countries_count' => $packageStats['countries_count'] ?? 0,
            'popular_packages' => $packageStats['popular_packages'] ?? 0,
            'total_purchases' => $packageStats['total_purchases'] ?? 0,
            'packages_with_voice' => $packageStats['packages_with_voice'] ?? 0,
            'packages_with_sms' => $packageStats['packages_with_sms'] ?? 0,
            'regions_count' => $packageStats['regions_count'] ?? 0,

            // Profile stats (for extended view)
            'profiles' => [
                'total' => ESIMProfile::count(),
                'active' => ESIMProfile::status('active')->count(),
                'new' => ESIMProfile::status('new')->count(),
                'expired' => ESIMProfile::status('expired')->count(),
                'cancelled' => ESIMProfile::status('cancelled')->count(),
            ],
            'subscriptions' => [
                'total' => ESIMSubscription::count(),
                'active' => ESIMSubscription::active()->count(),
                'expired' => ESIMSubscription::where('status', 'expired')->count(),
            ],
            'revenue' => [
                'total' => (float) ESIMProfile::sum('selling_price'),
                'profit' => (float) ESIMProfile::sum('profit'),
                'this_month' => (float) ESIMProfile::whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->sum('selling_price'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Sync packages from eSIM Access API
     * POST /api/admin/esim/sync-packages
     */
    public function syncPackages(): JsonResponse
    {
        $result = $this->packageService->syncPackages();

        return response()->json($result);
    }

    /**
     * Get all packages (admin view with wholesale prices)
     * GET /api/admin/esim/packages
     */
    public function packages(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
            'search' => ['sometimes', 'string'],
            'country' => ['sometimes', 'string'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $query = ESIMPackage::query();

        if (isset($validated['search'])) {
            $query->search($validated['search']);
        }

        if (isset($validated['country'])) {
            $query->country($validated['country']);
        }

        if (isset($validated['is_active'])) {
            $query->where('is_active', $validated['is_active']);
        }

        $packages = $query->orderByPopularity()
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $packages->items(),
            'meta' => [
                'current_page' => $packages->currentPage(),
                'last_page' => $packages->lastPage(),
                'per_page' => $packages->perPage(),
                'total' => $packages->total(),
            ],
        ]);
    }

    /**
     * Update package settings
     * PUT /api/admin/esim/package/{id}
     */
    public function updatePackage(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'markup_percentage' => ['sometimes', 'numeric', 'min:0', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
            'is_popular' => ['sometimes', 'boolean'],
        ]);

        $package = ESIMPackage::find($id);

        if (!$package) {
            return response()->json([
                'success' => false,
                'message' => 'Package not found',
            ], 404);
        }

        if (isset($validated['markup_percentage'])) {
            $result = $this->packageService->updatePackagePricing($id, $validated['markup_percentage']);

            if (!$result['success']) {
                return response()->json($result, 400);
            }
        }

        $package->update([
            'is_active' => $validated['is_active'] ?? $package->is_active,
            'is_popular' => $validated['is_popular'] ?? $package->is_popular,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Package updated successfully',
            'data' => $package->fresh(),
        ]);
    }

    /**
     * Get eSIM settings (markup, etc.)
     * GET /api/admin/esim/settings
     */
    public function getSettings(): JsonResponse
    {
        $settings = [
            'pricing' => [
                'profile_markup' => Setting::getEsimProfileMarkup(),
                'data_markup' => Setting::getEsimDataMarkup(),
                'exchange_rate' => $this->pricingService->getMarkupSettings()['exchange_rate'],
                'min_purchase_amount' => (float) Setting::getValue('esim_min_purchase_amount', 1000),
            ],
            'configuration' => [
                'auto_sync' => Setting::isEsimAutoSyncEnabled(),
                'sync_frequency_hours' => (int) Setting::getValue('esim_sync_frequency_hours', 24),
                'low_data_threshold' => Setting::getEsimLowDataThreshold(),
                'expiry_warning_days' => Setting::getEsimExpiryWarningDays(),
                'enable_usage_notifications' => (bool) Setting::getValue('esim_enable_usage_notifications', true),
                'max_profiles_per_user' => (int) Setting::getValue('esim_max_profiles_per_user', 10),
                'fulfillment_mode' => Setting::getValue('esim_fulfillment_mode', 'manual'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update eSIM settings
     * PUT /api/admin/esim/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'profile_markup' => ['sometimes', 'numeric', 'min:0', 'max:1000'],
            'data_markup' => ['sometimes', 'numeric', 'min:0', 'max:1000'],
            'exchange_rate' => ['sometimes', 'numeric', 'min:100', 'max:10000'],
            'auto_sync' => ['sometimes', 'boolean'],
            'sync_frequency_hours' => ['sometimes', 'integer', 'min:1', 'max:168'],
            'low_data_threshold' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'expiry_warning_days' => ['sometimes', 'integer', 'min:1', 'max:30'],
            'enable_usage_notifications' => ['sometimes', 'boolean'],
            'min_purchase_amount' => ['sometimes', 'numeric', 'min:0'],
            'max_profiles_per_user' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'fulfillment_mode' => ['sometimes', 'in:auto,manual'],
        ]);

        foreach ($validated as $key => $value) {
            $settingKey = 'esim_' . $key;
            $type = is_bool($value) ? 'boolean' : (is_int($value) ? 'integer' : (is_string($value) ? 'string' : 'float'));
            $group = in_array($key, ['profile_markup', 'data_markup', 'exchange_rate']) ? 'pricing' : 'esim';

            Setting::setValue($settingKey, $value, $type, $group);
        }

        // If pricing changed, trigger price recalculation
        if (isset($validated['profile_markup']) || isset($validated['data_markup']) || isset($validated['exchange_rate'])) {
            $this->packageService->recalculateAllPrices();
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * Get all eSIM orders/profiles (admin view)
     * GET /api/admin/esim/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:10', 'max:100'],
            'status' => ['sometimes', 'in:new,active,expired,cancelled,awaiting_fulfillment,pending'],
            'user_id' => ['sometimes', 'integer'],
        ]);

        $query = ESIMProfile::with(['user', 'subscriptions']);

        if (isset($validated['status'])) {
            $query->status($validated['status']);
        }

        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        $profiles = $query->orderBy('created_at', 'desc')
            ->paginate($validated['per_page'] ?? 20);

        return response()->json([
            'success' => true,
            'data' => $profiles->items(),
            'meta' => [
                'current_page' => $profiles->currentPage(),
                'last_page' => $profiles->lastPage(),
                'per_page' => $profiles->perPage(),
                'total' => $profiles->total(),
            ],
        ]);
    }

    /**
     * Test API connection
     * GET /api/admin/esim/test-connection
     */
    public function testConnection(): JsonResponse
    {
        $result = $this->zenditService->getBalance();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Zendit API connection successful' : 'Failed to connect to Zendit API',
            'data' => $result['data'] ?? null,
        ]);
    }

    /**
     * Get API balance
     * GET /api/admin/esim/balance
     */
    public function balance(): JsonResponse
    {
        $result = $this->zenditService->getBalance();

        return response()->json($result);
    }

    /**
     * Calculate price preview
     * GET /api/admin/esim/pricing-calculator
     */
    public function pricingCalculator(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'wholesale_usd' => ['required', 'numeric', 'min:0'],
            'type' => ['required', 'in:profile,data'],
        ]);

        $pricing = $validated['type'] === 'profile'
            ? $this->pricingService->calculateProfilePrice($validated['wholesale_usd'])
            : $this->pricingService->calculateDataBundlePrice($validated['wholesale_usd']);

        return response()->json([
            'success' => true,
            'data' => $pricing,
        ]);
    }

    /**
     * Get orders awaiting manual fulfillment
     * GET /api/admin/esim/fulfillment-queue
     */
    public function fulfillmentQueue(): JsonResponse
    {
        $orders = ESIMProfile::where('status', 'awaiting_fulfillment')
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($profile) => [
                'id' => $profile->id,
                'order_no' => $profile->order_no,
                'user' => [
                    'id' => $profile->user->id,
                    'name' => $profile->user->name,
                    'email' => $profile->user->email,
                ],
                'country_code' => $profile->country_code,
                'country_name' => $profile->country_name,
                'package_code' => $profile->package_code,
                'data_amount' => (float) $profile->data_amount,
                'data_formatted' => $profile->formatted_data,
                'duration_days' => $profile->duration_days,
                'selling_price' => (float) $profile->selling_price,
                'wholesale_price' => (float) $profile->wholesale_price,
                'profit' => (float) $profile->profit,
                'created_at' => $profile->created_at,
            ]);

        return response()->json([
            'success' => true,
            'data' => $orders,
            'meta' => [
                'pending_count' => $orders->count(),
            ],
        ]);
    }

    /**
     * Fulfill a manual eSIM order with credentials
     * POST /api/admin/esim/fulfill/{id}
     */
    public function fulfillOrder(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'iccid' => ['required', 'string'],
            'smdp_address' => ['required', 'string'],
            'activation_code' => ['required', 'string'],
            'qr_code_url' => ['nullable', 'string'],
        ]);

        $result = $this->purchaseService->fulfillOrder($id, $validated, $request->user()->id);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Reject a manual eSIM order and refund user
     * POST /api/admin/esim/reject/{id}
     */
    public function rejectOrder(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $result = $this->purchaseService->rejectOrder($id, $validated['reason'], $request->user()->id);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        return response()->json($result);
    }

    /**
     * Clear eSIM cache
     * POST /api/admin/esim/clear-cache
     */
    public function clearCache(): JsonResponse
    {
        $this->zenditService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'eSIM cache cleared successfully',
        ]);
    }
}
