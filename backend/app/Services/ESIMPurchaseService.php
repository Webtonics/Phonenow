<?php

namespace App\Services;

use App\Mail\ESIMFulfilled;
use App\Mail\ESIMRejected;
use App\Models\ESIMPackage;
use App\Models\ESIMProfile;
use App\Models\ESIMSubscription;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ESIMPurchaseService
{
    public function __construct(
        protected ZenditService $zenditService,
        protected ESIMPricingService $pricingService
    ) {}

    /**
     * Purchase a new eSIM profile via Zendit
     */
    public function purchaseProfile(User $user, int $packageId): array
    {
        DB::beginTransaction();

        try {
            // Get package
            $package = ESIMPackage::find($packageId);

            if (!$package || !$package->is_active) {
                return [
                    'success' => false,
                    'message' => 'Package not found or inactive',
                ];
            }

            // Check user balance
            if (!$user->hasBalance($package->selling_price)) {
                return [
                    'success' => false,
                    'message' => 'Insufficient balance. Please fund your wallet.',
                ];
            }

            // Deduct from wallet
            $balanceBefore = $user->balance;
            $user->deductBalance($package->selling_price);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Check fulfillment mode - manual means no Zendit API call
            $fulfillmentMode = Setting::getValue('esim_fulfillment_mode', 'manual');

            if ($fulfillmentMode === 'manual') {
                return $this->createManualOrder($user, $package, $balanceBefore, $balanceAfter);
            }

            // Generate unique transaction ID for Zendit
            $transactionId = $this->zenditService->generateTransactionId($user->id, 'ESIM');

            // Purchase from Zendit API
            $offerId = $package->offer_id ?? $package->package_code;
            $apiResult = $this->zenditService->purchaseEsim($transactionId, $offerId);

            if (!$apiResult['success']) {
                // Refund if API fails
                $user->addBalance($package->selling_price);
                DB::rollBack();

                return [
                    'success' => false,
                    'message' => 'eSIM provider error: ' . ($apiResult['message'] ?? 'Unknown error'),
                ];
            }

            $apiData = $apiResult['data'];
            $confirmation = $apiData['confirmation'] ?? [];
            $zenditStatus = $apiData['status'] ?? 'PENDING';

            // Extract eSIM credentials from confirmation
            $iccid = $confirmation['iccid'] ?? null;
            $smdpAddress = $confirmation['smdpAddress'] ?? null;
            $activationCode = $confirmation['activationCode'] ?? null;
            $externalRefId = $confirmation['externalReferenceId'] ?? null;

            // Build QR code data (LPA string) if we have the credentials
            $qrCodeData = null;
            if ($smdpAddress && $activationCode) {
                $qrCodeData = "LPA:1\${$smdpAddress}\${$activationCode}";
            }

            // Try to fetch QR code from Zendit if transaction is complete
            $qrCodeUrl = null;
            if ($this->zenditService->isComplete($zenditStatus)) {
                $qrResult = $this->zenditService->getQrCode($transactionId);
                if ($qrResult['success'] && isset($qrResult['data']['qrCode'])) {
                    $qrCodeUrl = $qrResult['data']['qrCode'];
                }
            }

            // Create eSIM profile record
            $profile = ESIMProfile::create([
                'user_id' => $user->id,
                'order_no' => $transactionId,
                'zendit_transaction_id' => $transactionId,
                'iccid' => $iccid,
                'qr_code_data' => $qrCodeData,
                'qr_code_url' => $qrCodeUrl,
                'smdp_address' => $smdpAddress,
                'activation_code' => $activationCode,
                'external_reference_id' => $externalRefId,
                'package_code' => $package->package_code,
                'offer_id' => $offerId,
                'country_code' => $package->country_code,
                'country_name' => $package->country_name,
                'data_amount' => $package->data_amount,
                'duration_days' => $package->duration_days,
                'voice_minutes' => $package->voice_minutes,
                'voice_unlimited' => $package->voice_unlimited,
                'sms_number' => $package->sms_number,
                'sms_unlimited' => $package->sms_unlimited,
                'wholesale_price' => $package->wholesale_price,
                'cost_usd' => $apiData['cost'] ?? $package->price_usd,
                'price_usd' => $package->price_usd,
                'selling_price' => $package->selling_price,
                'profit' => $package->selling_price - $package->wholesale_price,
                'status' => $this->zenditService->mapStatus($zenditStatus),
                'zendit_status' => $zenditStatus,
                'transaction_reference' => $transactionId,
                'redemption_instructions' => $confirmation['redemptionInstructions'] ?? null,
            ]);

            // Record transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'debit',
                'amount' => $package->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => $transactionId,
                'description' => "eSIM Purchase: {$package->country_name} - {$package->formatted_data}",
                'payment_method' => 'wallet',
            ]);

            // Increment package purchase count
            $package->incrementPurchases();

            // Process referral commission
            try {
                $referralService = new ReferralService();
                $transaction = Transaction::where('reference', $transactionId)->first();
                if ($transaction) {
                    $commissionAmount = $referralService->processCommission($transaction, $user->id);
                    if ($commissionAmount) {
                        Log::info('Referral commission processed for eSIM purchase', [
                            'user_id' => $user->id,
                            'commission_amount' => $commissionAmount,
                        ]);
                    }
                }
            } catch (\Exception $e) {
                Log::error('Referral commission processing failed for eSIM', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            DB::commit();

            Log::info('Zendit eSIM Profile Purchased', [
                'user_id' => $user->id,
                'profile_id' => $profile->id,
                'transaction_id' => $transactionId,
                'zendit_status' => $zenditStatus,
                'iccid' => $iccid,
                'amount' => $package->selling_price,
            ]);

            // Determine user-friendly message based on status
            $isPending = $this->zenditService->isProcessing($zenditStatus);
            $message = $isPending
                ? 'eSIM purchased! Your eSIM credentials are being prepared. This usually takes a few seconds - check "My eSIMs" to view when ready.'
                : 'eSIM profile purchased successfully';

            return [
                'success' => true,
                'message' => $message,
                'data' => [
                    'profile' => $this->formatProfileResponse($profile),
                    'new_balance' => $balanceAfter,
                    'is_pending' => $isPending,
                ],
            ];

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Zendit eSIM Purchase Failed', [
                'user_id' => $user->id,
                'package_id' => $packageId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message' => 'Purchase failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check and update purchase status from Zendit
     * Useful for pending transactions
     */
    public function checkPurchaseStatus(ESIMProfile $profile): array
    {
        $transactionId = $profile->zendit_transaction_id ?? $profile->order_no;

        if (!$transactionId) {
            return [
                'success' => false,
                'message' => 'No transaction ID found',
            ];
        }

        $result = $this->zenditService->getPurchase($transactionId);

        if (!$result['success']) {
            return $result;
        }

        $apiData = $result['data'];
        $zenditStatus = $apiData['status'] ?? $profile->zendit_status;
        $confirmation = $apiData['confirmation'] ?? [];

        // Update profile with latest data
        $updateData = [
            'zendit_status' => $zenditStatus,
            'status' => $this->zenditService->mapStatus($zenditStatus),
        ];

        // Update credentials if now available
        if (empty($profile->iccid) && !empty($confirmation['iccid'])) {
            $updateData['iccid'] = $confirmation['iccid'];
        }

        if (empty($profile->smdp_address) && !empty($confirmation['smdpAddress'])) {
            $updateData['smdp_address'] = $confirmation['smdpAddress'];
            $updateData['activation_code'] = $confirmation['activationCode'] ?? null;

            // Build QR code data
            if ($confirmation['smdpAddress'] && $confirmation['activationCode']) {
                $updateData['qr_code_data'] = "LPA:1\${$confirmation['smdpAddress']}\${$confirmation['activationCode']}";
            }
        }

        // Fetch QR code if transaction is complete and we don't have it
        if ($this->zenditService->isComplete($zenditStatus) && empty($profile->qr_code_url)) {
            $qrResult = $this->zenditService->getQrCode($transactionId);
            if ($qrResult['success'] && isset($qrResult['data']['qrCode'])) {
                $updateData['qr_code_url'] = $qrResult['data']['qrCode'];
            }
        }

        $profile->update($updateData);

        Log::info('Zendit eSIM Status Updated', [
            'profile_id' => $profile->id,
            'transaction_id' => $transactionId,
            'zendit_status' => $zenditStatus,
        ]);

        return [
            'success' => true,
            'message' => 'Status updated',
            'data' => [
                'profile' => $this->formatProfileResponse($profile->fresh()),
                'zendit_status' => $zenditStatus,
            ],
        ];
    }

    /**
     * Get QR code for an eSIM profile
     */
    public function getQrCode(ESIMProfile $profile): array
    {
        // Return cached QR code if available
        if ($profile->qr_code_url) {
            return [
                'success' => true,
                'data' => [
                    'qr_code_url' => $profile->qr_code_url,
                    'qr_code_data' => $profile->qr_code_data,
                    'lpa_string' => $profile->lpa_string,
                ],
            ];
        }

        $transactionId = $profile->zendit_transaction_id ?? $profile->order_no;

        if (!$transactionId) {
            return [
                'success' => false,
                'message' => 'No transaction ID found',
            ];
        }

        $result = $this->zenditService->getQrCode($transactionId);

        if ($result['success'] && isset($result['data']['qrCode'])) {
            // Cache the QR code URL
            $profile->update(['qr_code_url' => $result['data']['qrCode']]);

            return [
                'success' => true,
                'data' => [
                    'qr_code_url' => $result['data']['qrCode'],
                    'qr_code_data' => $profile->qr_code_data,
                    'lpa_string' => $profile->lpa_string,
                ],
            ];
        }

        return $result;
    }

    /**
     * Top-up data on existing eSIM
     * Note: Zendit may not support topup on existing eSIMs - this is provider dependent
     */
    public function topUpData(User $user, int $profileId, int $packageId): array
    {
        DB::beginTransaction();

        try {
            $profile = ESIMProfile::where('id', $profileId)
                ->where('user_id', $user->id)
                ->first();

            if (!$profile) {
                return [
                    'success' => false,
                    'message' => 'eSIM profile not found',
                ];
            }

            if (!$profile->canTopUp()) {
                return [
                    'success' => false,
                    'message' => 'This eSIM cannot be topped up (expired or cancelled)',
                ];
            }

            $package = ESIMPackage::find($packageId);

            if (!$package || !$package->is_active) {
                return [
                    'success' => false,
                    'message' => 'Package not found or inactive',
                ];
            }

            // Verify same country
            if ($package->country_code !== $profile->country_code) {
                return [
                    'success' => false,
                    'message' => 'Package must be for the same country as the eSIM',
                ];
            }

            if (!$user->hasBalance($package->selling_price)) {
                return [
                    'success' => false,
                    'message' => 'Insufficient balance. Please fund your wallet.',
                ];
            }

            // Deduct from wallet
            $balanceBefore = $user->balance;
            $user->deductBalance($package->selling_price);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Generate transaction ID for topup
            $transactionId = $this->zenditService->generateTransactionId($user->id, 'TOPUP');

            // Attempt purchase via Zendit
            // Note: This creates a new eSIM rather than topping up existing one
            // Zendit doesn't have a native topup endpoint for existing eSIMs
            $offerId = $package->offer_id ?? $package->package_code;
            $apiResult = $this->zenditService->purchaseEsim($transactionId, $offerId);

            if (!$apiResult['success']) {
                $user->addBalance($package->selling_price);
                DB::rollBack();

                return [
                    'success' => false,
                    'message' => 'Top-up failed: ' . ($apiResult['message'] ?? 'Unknown error'),
                ];
            }

            $apiData = $apiResult['data'];
            $zenditStatus = $apiData['status'] ?? 'PENDING';

            // Create subscription record
            $subscription = ESIMSubscription::create([
                'esim_profile_id' => $profile->id,
                'user_id' => $user->id,
                'zendit_transaction_id' => $transactionId,
                'package_code' => $package->package_code,
                'offer_id' => $offerId,
                'data_amount' => $package->data_amount,
                'duration_days' => $package->duration_days,
                'data_used' => 0,
                'data_remaining' => $package->data_amount,
                'wholesale_price' => $package->wholesale_price,
                'cost_usd' => $apiData['cost'] ?? $package->price_usd,
                'price_usd' => $package->price_usd,
                'selling_price' => $package->selling_price,
                'profit' => $package->selling_price - $package->wholesale_price,
                'status' => 'active',
                'zendit_status' => $zenditStatus,
                'activated_at' => now(),
                'expires_at' => now()->addDays($package->duration_days),
                'transaction_reference' => $transactionId,
            ]);

            // Update profile expiry if this extends it
            if (!$profile->expires_at || now()->addDays($package->duration_days)->gt($profile->expires_at)) {
                $profile->update([
                    'expires_at' => now()->addDays($package->duration_days),
                    'status' => 'active',
                ]);
            }

            // Record transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'debit',
                'amount' => $package->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => $transactionId,
                'description' => "eSIM Top-up: {$package->formatted_data} for {$profile->country_name}",
                'payment_method' => 'wallet',
            ]);

            $package->incrementPurchases();

            DB::commit();

            Log::info('Zendit eSIM Data Topped Up', [
                'user_id' => $user->id,
                'profile_id' => $profile->id,
                'subscription_id' => $subscription->id,
                'transaction_id' => $transactionId,
                'amount' => $package->selling_price,
            ]);

            return [
                'success' => true,
                'message' => 'Data topped up successfully',
                'data' => [
                    'subscription' => $subscription->fresh(),
                    'profile' => $this->formatProfileResponse($profile->fresh()),
                    'new_balance' => $balanceAfter,
                ],
            ];

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Zendit eSIM Top-up Failed', [
                'user_id' => $user->id,
                'profile_id' => $profileId,
                'package_id' => $packageId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Top-up failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Cancel eSIM and request refund via Zendit
     */
    public function cancelProfile(User $user, int $profileId): array
    {
        DB::beginTransaction();

        try {
            $profile = ESIMProfile::where('id', $profileId)
                ->where('user_id', $user->id)
                ->first();

            if (!$profile) {
                return [
                    'success' => false,
                    'message' => 'eSIM profile not found',
                ];
            }

            // Only unused profiles can be cancelled
            if (!in_array($profile->status, ['new', 'pending', 'awaiting_fulfillment'])) {
                return [
                    'success' => false,
                    'message' => 'Only unused eSIMs can be cancelled. This eSIM is: ' . $profile->status,
                ];
            }

            $isManualOrder = empty($profile->zendit_transaction_id);

            // Only call Zendit refund API for auto-fulfilled orders
            if (!$isManualOrder) {
                $transactionId = $profile->zendit_transaction_id ?? $profile->order_no;
                $apiResult = $this->zenditService->requestRefund($transactionId);

                if (!$apiResult['success']) {
                    return [
                        'success' => false,
                        'message' => 'Cancellation failed: ' . ($apiResult['message'] ?? 'Unknown error'),
                    ];
                }
            }

            // Refund to wallet
            $balanceBefore = $user->balance;
            $user->addBalance($profile->selling_price);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Update profile status
            $profile->update([
                'status' => 'cancelled',
                'zendit_status' => 'REFUNDED',
            ]);

            // Record refund transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'amount' => $profile->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => "eSIM Cancellation Refund: {$profile->country_name}",
                'payment_method' => 'refund',
            ]);

            DB::commit();

            Log::info('Zendit eSIM Profile Cancelled', [
                'user_id' => $user->id,
                'profile_id' => $profile->id,
                'transaction_id' => $transactionId,
                'refund_amount' => $profile->selling_price,
            ]);

            return [
                'success' => true,
                'message' => 'eSIM cancelled and refunded successfully',
                'data' => [
                    'refunded_amount' => $profile->selling_price,
                    'new_balance' => $balanceAfter,
                ],
            ];

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Zendit eSIM Cancellation Failed', [
                'user_id' => $user->id,
                'profile_id' => $profileId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Cancellation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Check refund status
     */
    public function checkRefundStatus(ESIMProfile $profile): array
    {
        $transactionId = $profile->zendit_transaction_id ?? $profile->order_no;

        if (!$transactionId) {
            return [
                'success' => false,
                'message' => 'No transaction ID found',
            ];
        }

        return $this->zenditService->getRefundStatus($transactionId);
    }

    /**
     * Update eSIM usage statistics from Zendit
     */
    public function updateUsageStats(ESIMProfile $profile): array
    {
        $transactionId = $profile->zendit_transaction_id ?? $profile->order_no;

        if (!$transactionId) {
            return [
                'success' => false,
                'message' => 'No transaction ID found',
            ];
        }

        $result = $this->zenditService->getUsage($transactionId);

        if (!$result['success']) {
            return $result;
        }

        $usageData = $result['data'];

        // Update active subscriptions with usage data if available
        if (isset($usageData['dataUsed']) || isset($usageData['dataRemaining'])) {
            $profile->activeSubscriptions()->update([
                'data_used' => $usageData['dataUsed'] ?? 0,
                'data_remaining' => $usageData['dataRemaining'] ?? 0,
                'last_usage_check' => now(),
            ]);
        }

        Log::info('Zendit eSIM Usage Updated', [
            'profile_id' => $profile->id,
            'transaction_id' => $transactionId,
            'usage_data' => $usageData,
        ]);

        return [
            'success' => true,
            'message' => 'Usage updated',
            'data' => $usageData,
        ];
    }

    /**
     * Create a manual fulfillment order (no Zendit API call)
     */
    protected function createManualOrder(User $user, ESIMPackage $package, float $balanceBefore, float $balanceAfter): array
    {
        $transactionId = 'PN-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 10)) . '-' . $user->id;

        // Create eSIM profile with awaiting_fulfillment status
        $profile = ESIMProfile::create([
            'user_id' => $user->id,
            'order_no' => $transactionId,
            'package_code' => $package->package_code,
            'offer_id' => $package->offer_id ?? $package->package_code,
            'country_code' => $package->country_code,
            'country_name' => $package->country_name,
            'data_amount' => $package->data_amount,
            'duration_days' => $package->duration_days,
            'voice_minutes' => $package->voice_minutes,
            'voice_unlimited' => $package->voice_unlimited,
            'sms_number' => $package->sms_number,
            'sms_unlimited' => $package->sms_unlimited,
            'wholesale_price' => $package->wholesale_price,
            'cost_usd' => $package->price_usd,
            'price_usd' => $package->price_usd,
            'selling_price' => $package->selling_price,
            'profit' => $package->selling_price - $package->wholesale_price,
            'status' => 'awaiting_fulfillment',
            'zendit_status' => 'AWAITING_FULFILLMENT',
            'transaction_reference' => $transactionId,
        ]);

        // Record transaction
        Transaction::create([
            'user_id' => $user->id,
            'type' => 'debit',
            'amount' => $package->selling_price,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'status' => 'completed',
            'reference' => $transactionId,
            'description' => "eSIM Purchase: {$package->country_name} - {$package->formatted_data}",
            'payment_method' => 'wallet',
        ]);

        // Increment package purchase count
        $package->incrementPurchases();

        // Process referral commission
        try {
            $referralService = new ReferralService();
            $transaction = Transaction::where('reference', $transactionId)->first();
            if ($transaction) {
                $referralService->processCommission($transaction, $user->id);
            }
        } catch (\Exception $e) {
            Log::error('Referral commission failed for manual eSIM', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        DB::commit();

        Log::info('Manual eSIM Order Created', [
            'user_id' => $user->id,
            'profile_id' => $profile->id,
            'transaction_id' => $transactionId,
            'amount' => $package->selling_price,
        ]);

        return [
            'success' => true,
            'message' => 'eSIM purchased! Your order is being processed. You\'ll be notified when your eSIM is ready.',
            'data' => [
                'profile' => $this->formatProfileResponse($profile),
                'new_balance' => $balanceAfter,
                'is_pending' => true,
            ],
        ];
    }

    /**
     * Admin fulfills a manual order with eSIM credentials
     */
    public function fulfillOrder(int $profileId, array $credentials, int $adminId): array
    {
        DB::beginTransaction();

        try {
            $profile = ESIMProfile::with('user')->find($profileId);

            if (!$profile) {
                return ['success' => false, 'message' => 'Order not found'];
            }

            if ($profile->status !== 'awaiting_fulfillment') {
                return ['success' => false, 'message' => 'Order is not awaiting fulfillment. Current status: ' . $profile->status];
            }

            $smdpAddress = $credentials['smdp_address'];
            $activationCode = $credentials['activation_code'];
            $qrCodeData = "LPA:1\${$smdpAddress}\${$activationCode}";

            // Auto-generate QR code URL from LPA string if not provided
            $qrCodeUrl = $credentials['qr_code_url'] ?? null;
            if (empty($qrCodeUrl)) {
                $qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=' . urlencode($qrCodeData);
            }

            $profile->update([
                'iccid' => $credentials['iccid'],
                'smdp_address' => $smdpAddress,
                'activation_code' => $activationCode,
                'qr_code_data' => $qrCodeData,
                'qr_code_url' => $qrCodeUrl,
                'status' => 'new',
                'zendit_status' => 'FULFILLED',
                'notes' => "Fulfilled at " . now()->toDateTimeString(),
            ]);

            DB::commit();

            // Send email notification
            try {
                Mail::to($profile->user->email)->send(new ESIMFulfilled($profile->fresh()));
            } catch (\Exception $e) {
                Log::error('Failed to send eSIM fulfilled email', [
                    'profile_id' => $profile->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Manual eSIM Order Fulfilled', [
                'profile_id' => $profile->id,
                'admin_id' => $adminId,
                'user_id' => $profile->user_id,
            ]);

            return [
                'success' => true,
                'message' => 'Order fulfilled successfully. User has been notified.',
                'data' => $this->formatProfileResponse($profile->fresh()),
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Manual eSIM Fulfillment Failed', [
                'profile_id' => $profileId,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => 'Fulfillment failed: ' . $e->getMessage()];
        }
    }

    /**
     * Admin rejects a manual order and refunds the user
     */
    public function rejectOrder(int $profileId, string $reason, int $adminId): array
    {
        DB::beginTransaction();

        try {
            $profile = ESIMProfile::with('user')->find($profileId);

            if (!$profile) {
                return ['success' => false, 'message' => 'Order not found'];
            }

            if ($profile->status !== 'awaiting_fulfillment') {
                return ['success' => false, 'message' => 'Order is not awaiting fulfillment. Current status: ' . $profile->status];
            }

            $user = $profile->user;

            // Refund to wallet
            $balanceBefore = $user->balance;
            $user->addBalance($profile->selling_price);
            $user->refresh();
            $balanceAfter = $user->balance;

            // Update profile status
            $profile->update([
                'status' => 'cancelled',
                'zendit_status' => 'REJECTED',
                'notes' => "Rejected: {$reason}",
            ]);

            // Record refund transaction
            Transaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'amount' => $profile->selling_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'status' => 'completed',
                'reference' => Transaction::generateReference(),
                'description' => "eSIM Order Refund: {$profile->country_name} - {$reason}",
                'payment_method' => 'refund',
            ]);

            DB::commit();

            // Send email notification
            try {
                Mail::to($user->email)->send(new ESIMRejected($profile->fresh(), $reason));
            } catch (\Exception $e) {
                Log::error('Failed to send eSIM rejected email', [
                    'profile_id' => $profile->id,
                    'error' => $e->getMessage(),
                ]);
            }

            Log::info('Manual eSIM Order Rejected', [
                'profile_id' => $profile->id,
                'admin_id' => $adminId,
                'user_id' => $user->id,
                'reason' => $reason,
                'refunded' => $profile->selling_price,
            ]);

            return [
                'success' => true,
                'message' => 'Order rejected and user refunded ₦' . number_format($profile->selling_price) . '.',
                'data' => [
                    'refunded_amount' => (float) $profile->selling_price,
                ],
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Manual eSIM Rejection Failed', [
                'profile_id' => $profileId,
                'error' => $e->getMessage(),
            ]);

            return ['success' => false, 'message' => 'Rejection failed: ' . $e->getMessage()];
        }
    }

    /**
     * Format profile response for API
     */
    protected function formatProfileResponse(ESIMProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'order_no' => $profile->order_no,
            'transaction_id' => $profile->zendit_transaction_id,
            'iccid' => $profile->iccid,
            'qr_code_data' => $profile->qr_code_data,
            'qr_code_url' => $profile->qr_code_url,
            'lpa_string' => $profile->lpa_string,
            'smdp_address' => $profile->smdp_address,
            'activation_code' => $profile->activation_code,
            'country_code' => $profile->country_code,
            'country_name' => $profile->country_name,
            'data_amount' => (float) $profile->data_amount,
            'data_formatted' => $profile->formatted_data,
            'duration_days' => $profile->duration_days,
            'voice_minutes' => $profile->voice_minutes,
            'voice_unlimited' => $profile->voice_unlimited,
            'voice_formatted' => $profile->formatted_voice,
            'sms_number' => $profile->sms_number,
            'sms_unlimited' => $profile->sms_unlimited,
            'sms_formatted' => $profile->formatted_sms,
            'selling_price' => (float) $profile->selling_price,
            'status' => $profile->status,
            'zendit_status' => $profile->zendit_status,
            'is_active' => $profile->isActive(),
            'can_topup' => $profile->canTopUp(),
            'has_voice' => $profile->hasVoice(),
            'has_sms' => $profile->hasSms(),
            'activated_at' => $profile->activated_at,
            'expires_at' => $profile->expires_at,
            'created_at' => $profile->created_at,
            'redemption_instructions' => $profile->redemption_instructions,
        ];
    }
}
