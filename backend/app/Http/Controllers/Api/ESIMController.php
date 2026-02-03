<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ESIMPackage;
use App\Models\ESIMProfile;
use App\Services\ESIMPackageService;
use App\Services\ESIMPurchaseService;
use App\Services\ZenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ESIMController extends Controller
{
    public function __construct(
        protected ESIMPackageService $packageService,
        protected ESIMPurchaseService $purchaseService,
        protected ZenditService $zenditService
    ) {}

    /**
     * Handle controller exceptions with consistent response format
     */
    protected function handleException(\Exception $e, string $context): JsonResponse
    {
        Log::error("ESIMController error: {$context}", [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        return response()->json([
            'success' => false,
            'message' => 'An error occurred while processing your request. Please try again.',
        ], 500);
    }

    /**
     * Get all available eSIM packages
     * GET /api/esim/packages
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'country' => ['sometimes', 'string', 'size:2'],
                'region' => ['sometimes', 'string'],
                'type' => ['sometimes', 'in:profile,topup'],
                'search' => ['sometimes', 'string'],
                'sort' => ['sometimes', 'in:price,popular,data,price_high'],
                'has_voice' => ['sometimes', 'boolean'],
                'has_sms' => ['sometimes', 'boolean'],
            ]);

            $packages = $this->packageService->getActivePackages($validated);

            return response()->json([
                'success' => true,
                'data' => $packages->map(fn($pkg) => $this->formatPackage($pkg)),
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e, 'index');
        }
    }

    /**
     * Get packages for a specific country
     * GET /api/esim/packages/{countryCode}
     */
    public function byCountry(string $countryCode): JsonResponse
    {
        $packages = $this->packageService->getPackagesByCountry(strtoupper($countryCode));

        return response()->json([
            'success' => true,
            'data' => $packages->map(fn($pkg) => $this->formatPackage($pkg)),
        ]);
    }

    /**
     * Get popular packages
     * GET /api/esim/popular
     */
    public function popular(): JsonResponse
    {
        $packages = $this->packageService->getPopularPackages(12);

        return response()->json([
            'success' => true,
            'data' => $packages->map(fn($pkg) => $this->formatPackage($pkg)),
        ]);
    }

    /**
     * Get supported countries
     * GET /api/esim/countries
     */
    public function countries(): JsonResponse
    {
        $countries = $this->packageService->getAvailableCountries();

        return response()->json([
            'success' => true,
            'data' => $countries,
        ]);
    }

    /**
     * Get available regions
     * GET /api/esim/regions
     */
    public function regions(): JsonResponse
    {
        $regions = $this->packageService->getAvailableRegions();

        return response()->json([
            'success' => true,
            'data' => $regions,
        ]);
    }

    /**
     * Get single package details
     * GET /api/esim/package/{id}
     */
    public function showPackage(int $id): JsonResponse
    {
        $package = ESIMPackage::find($id);

        if (!$package || !$package->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Package not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatPackage($package),
        ]);
    }

    /**
     * Purchase eSIM profile
     * POST /api/esim/purchase
     */
    public function purchase(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'package_id' => ['required', 'integer', 'exists:esim_packages,id'],
            ]);

            $user = $request->user();
            $result = $this->purchaseService->purchaseProfile($user, $validated['package_id']);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'],
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e, 'purchase');
        }
    }

    /**
     * Top-up data on existing eSIM
     * POST /api/esim/topup/{profileId}
     */
    public function topup(Request $request, int $profileId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'package_id' => ['required', 'integer', 'exists:esim_packages,id'],
            ]);

            $user = $request->user();
            $result = $this->purchaseService->topUpData($user, $profileId, $validated['package_id']);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'],
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e, 'topup');
        }
    }

    /**
     * Get user's eSIM profiles
     * GET /api/esim/my-profiles
     */
    public function myProfiles(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'status' => ['sometimes', 'in:new,active,expired,cancelled,pending,processing'],
            ]);

            $query = ESIMProfile::where('user_id', $user->id)
                ->with(['subscriptions', 'user'])
                ->orderBy('created_at', 'desc');

            if (isset($validated['status'])) {
                $query->status($validated['status']);
            }

            $profiles = $query->get()->map(fn($profile) => $this->formatProfile($profile));

            return response()->json([
                'success' => true,
                'data' => $profiles,
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e, 'myProfiles');
        }
    }

    /**
     * Get specific eSIM profile details
     * GET /api/esim/profile/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $profile = ESIMProfile::where('id', $id)
            ->where('user_id', $user->id)
            ->with(['subscriptions' => fn($q) => $q->orderBy('created_at', 'desc')])
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'eSIM profile not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatProfileDetailed($profile),
        ]);
    }

    /**
     * Get QR code for eSIM
     * GET /api/esim/profile/{id}/qrcode
     */
    public function qrCode(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $profile = ESIMProfile::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'eSIM profile not found',
            ], 404);
        }

        $result = $this->purchaseService->getQrCode($profile);

        return response()->json($result);
    }

    /**
     * Check/refresh eSIM status
     * POST /api/esim/profile/{id}/refresh
     */
    public function refreshStatus(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();

            $profile = ESIMProfile::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$profile) {
                return response()->json([
                    'success' => false,
                    'message' => 'eSIM profile not found',
                ], 404);
            }

            $result = $this->purchaseService->checkPurchaseStatus($profile);

            return response()->json($result);
        } catch (\Exception $e) {
            return $this->handleException($e, 'refreshStatus');
        }
    }

    /**
     * Cancel eSIM and get refund
     * POST /api/esim/cancel/{id}
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $user = $request->user();
            $result = $this->purchaseService->cancelProfile($user, $id);

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => $result['data'],
            ]);
        } catch (\Exception $e) {
            return $this->handleException($e, 'cancel');
        }
    }

    /**
     * Update usage statistics for eSIM
     * POST /api/esim/update-usage/{id}
     */
    public function updateUsage(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $profile = ESIMProfile::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'eSIM profile not found',
            ], 404);
        }

        $result = $this->purchaseService->updateUsageStats($profile);

        return response()->json($result);
    }

    /**
     * Get Zendit API balance (for debugging)
     * GET /api/esim/balance
     */
    public function balance(): JsonResponse
    {
        try {
            $result = $this->zenditService->getBalance();

            return response()->json($result);
        } catch (\Exception $e) {
            return $this->handleException($e, 'balance');
        }
    }

    /**
     * Format package for API response
     */
    protected function formatPackage(ESIMPackage $pkg): array
    {
        return [
            'id' => $pkg->id,
            'offer_id' => $pkg->offer_id,
            'package_code' => $pkg->package_code,
            'brand' => $pkg->brand,
            'country_code' => $pkg->country_code,
            'country_name' => $pkg->country_name,
            'country_flag' => $this->zenditService->getCountryFlag($pkg->country_code),
            'region' => $pkg->region,
            'regions' => $pkg->regions,

            // Data
            'data_amount' => (float) $pkg->data_amount,
            'data_gb' => $pkg->data_gb ? (float) $pkg->data_gb : null,
            'data_formatted' => $pkg->formatted_data,
            'data_unlimited' => $pkg->data_unlimited,

            // Duration
            'duration_days' => $pkg->duration_days,
            'duration_formatted' => $pkg->formatted_duration,

            // Network
            'network_type' => $pkg->network_type,
            'data_speeds' => $pkg->data_speeds,
            'speeds_formatted' => $pkg->formatted_speeds,

            // Voice & SMS
            'voice_minutes' => $pkg->voice_minutes,
            'voice_unlimited' => $pkg->voice_unlimited,
            'voice_formatted' => $pkg->formatted_voice,
            'has_voice' => $pkg->hasVoice(),
            'sms_number' => $pkg->sms_number,
            'sms_unlimited' => $pkg->sms_unlimited,
            'sms_formatted' => $pkg->formatted_sms,
            'has_sms' => $pkg->hasSms(),

            // Roaming
            'roaming_countries' => $pkg->roaming_countries,
            'has_roaming' => $pkg->hasRoaming(),

            // Pricing
            'price_usd' => $pkg->price_usd ? (float) $pkg->price_usd : null,
            'selling_price' => (float) $pkg->selling_price,

            // Classification
            'package_type' => $pkg->package_type,
            'is_popular' => $pkg->is_popular,
        ];
    }

    /**
     * Format profile for list view
     */
    protected function formatProfile(ESIMProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'order_no' => $profile->order_no,
            'transaction_id' => $profile->zendit_transaction_id,
            'iccid' => $profile->iccid,
            'country_code' => $profile->country_code,
            'country_name' => $profile->country_name,
            'country_flag' => $this->zenditService->getCountryFlag($profile->country_code),
            'data_amount' => (float) $profile->data_amount,
            'data_formatted' => $profile->formatted_data,
            'duration_days' => $profile->duration_days,
            'has_voice' => $profile->hasVoice(),
            'has_sms' => $profile->hasSms(),
            'voice_formatted' => $profile->formatted_voice,
            'sms_formatted' => $profile->formatted_sms,
            'selling_price' => (float) $profile->selling_price,
            'status' => $profile->status,
            'zendit_status' => $profile->zendit_status,
            'is_active' => $profile->isActive(),
            'can_topup' => $profile->canTopUp(),
            'total_data_remaining' => $profile->getTotalDataRemaining(),
            'activated_at' => $profile->activated_at,
            'expires_at' => $profile->expires_at,
            'created_at' => $profile->created_at,
            'subscriptions_count' => $profile->subscriptions->count(),
        ];
    }

    /**
     * Format profile for detailed view
     */
    protected function formatProfileDetailed(ESIMProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'order_no' => $profile->order_no,
            'transaction_id' => $profile->zendit_transaction_id,
            'iccid' => $profile->iccid,

            // QR Code & Activation
            'qr_code_data' => $profile->qr_code_data,
            'qr_code_url' => $profile->qr_code_url,
            'lpa_string' => $profile->lpa_string,
            'smdp_address' => $profile->smdp_address,
            'activation_code' => $profile->activation_code,

            // Location
            'country_code' => $profile->country_code,
            'country_name' => $profile->country_name,
            'country_flag' => $this->zenditService->getCountryFlag($profile->country_code),

            // Data
            'data_amount' => (float) $profile->data_amount,
            'data_formatted' => $profile->formatted_data,
            'duration_days' => $profile->duration_days,

            // Voice & SMS
            'voice_minutes' => $profile->voice_minutes,
            'voice_unlimited' => $profile->voice_unlimited,
            'voice_formatted' => $profile->formatted_voice,
            'has_voice' => $profile->hasVoice(),
            'sms_number' => $profile->sms_number,
            'sms_unlimited' => $profile->sms_unlimited,
            'sms_formatted' => $profile->formatted_sms,
            'has_sms' => $profile->hasSms(),

            // Pricing
            'selling_price' => (float) $profile->selling_price,

            // Status
            'status' => $profile->status,
            'zendit_status' => $profile->zendit_status,
            'is_active' => $profile->isActive(),
            'can_topup' => $profile->canTopUp(),
            'total_data_remaining' => $profile->getTotalDataRemaining(),

            // Dates
            'activated_at' => $profile->activated_at,
            'expires_at' => $profile->expires_at,
            'created_at' => $profile->created_at,

            // Instructions
            'redemption_instructions' => $profile->redemption_instructions,

            // Subscriptions
            'subscriptions' => $profile->subscriptions->map(fn($sub) => [
                'id' => $sub->id,
                'package_code' => $sub->package_code,
                'data_amount' => (float) $sub->data_amount,
                'data_formatted' => $sub->formatted_data,
                'data_used' => (float) $sub->data_used,
                'data_remaining' => (float) $sub->data_remaining,
                'data_remaining_formatted' => $sub->formatted_remaining,
                'usage_percentage' => $sub->getUsagePercentage(),
                'is_low_data' => $sub->isDataLow(),
                'selling_price' => (float) $sub->selling_price,
                'status' => $sub->status,
                'zendit_status' => $sub->zendit_status,
                'activated_at' => $sub->activated_at,
                'expires_at' => $sub->expires_at,
                'created_at' => $sub->created_at,
            ]),
        ];
    }
}
