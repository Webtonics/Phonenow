<?php

namespace App\Http\Controllers\Api\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\ESIMProfile;
use App\Models\ESIMSubscription;
use App\Services\ZenditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class ZenditWebhookController extends Controller
{
    public function __construct(
        protected ZenditService $zenditService
    ) {}

    /**
     * Handle HEAD request for webhook verification
     * Zendit uses HEAD requests to verify the webhook endpoint is reachable
     *
     * GET /api/webhooks/zendit/esim
     * HEAD /api/webhooks/zendit/esim
     */
    public function verify(Request $request): Response
    {
        Log::info('Zendit webhook verification request', [
            'method' => $request->method(),
            'ip' => $request->ip(),
        ]);

        return response('OK', 200);
    }

    /**
     * Handle eSIM webhook notifications from Zendit
     * POST /api/webhooks/zendit/esim
     *
     * Zendit sends webhook notifications when transaction status changes.
     * We must respond with 200 immediately, then process async.
     */
    public function handleEsim(Request $request): JsonResponse
    {
        // Verify authorization header
        if (!$this->verifyAuthorization($request)) {
            Log::warning('Zendit webhook unauthorized', [
                'ip' => $request->ip(),
                'headers' => $request->headers->all(),
            ]);

            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();

        Log::info('Zendit eSIM webhook received', [
            'ip' => $request->ip(),
            'payload' => $payload,
        ]);

        // Extract transaction ID
        $transactionId = $payload['transactionId'] ?? null;

        if (!$transactionId) {
            Log::error('Zendit webhook missing transactionId', ['payload' => $payload]);
            return response()->json(['error' => 'Missing transactionId'], 400);
        }

        // Process the webhook (async would be better, but keep simple for now)
        try {
            $result = $this->processEsimWebhook($payload);

            Log::info('Zendit webhook processed', [
                'transactionId' => $transactionId,
                'result' => $result,
            ]);

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Zendit webhook processing failed', [
                'transactionId' => $transactionId,
                'error' => $e->getMessage(),
            ]);

            // Still return 200 to prevent Zendit from retrying
            // We'll need to handle this manually or via a recovery job
            return response()->json(['success' => true, 'note' => 'Processing queued']);
        }
    }

    /**
     * Verify the webhook authorization header
     */
    protected function verifyAuthorization(Request $request): bool
    {
        $webhookSecret = config('esim.webhook_secret');

        // If no secret configured, skip verification (not recommended for production)
        if (empty($webhookSecret)) {
            Log::warning('Zendit webhook secret not configured - skipping verification');
            return true;
        }

        $authHeader = $request->header('Authorization');

        if (!$authHeader) {
            return false;
        }

        // Zendit uses "Bearer <secret>" format
        if (str_starts_with($authHeader, 'Bearer ')) {
            $providedSecret = substr($authHeader, 7);
            return hash_equals($webhookSecret, $providedSecret);
        }

        // Also check for direct match (some implementations)
        return hash_equals($webhookSecret, $authHeader);
    }

    /**
     * Process eSIM webhook payload
     *
     * Payload structure (similar to purchase status response):
     * {
     *   "transactionId": "ESIM_123_1234567890_abc12345",
     *   "status": "DONE",
     *   "offerId": "ESIM-NG-MTNG-1GB-30D",
     *   "brand": "MTN Nigeria",
     *   "cost": { "price": 5.00, "currency": "USD" },
     *   "confirmation": {
     *     "iccid": "8901234567890123456",
     *     "smdpAddress": "smdp.example.com",
     *     "activationCode": "ABC123XYZ"
     *   },
     *   "error": null,
     *   "createdAt": "2025-01-28T10:00:00Z",
     *   "updatedAt": "2025-01-28T10:05:00Z"
     * }
     */
    protected function processEsimWebhook(array $payload): array
    {
        $transactionId = $payload['transactionId'];
        $zenditStatus = $payload['status'] ?? 'UNKNOWN';
        $internalStatus = $this->zenditService->mapStatus($zenditStatus);

        // Find the profile by transaction ID
        $profile = ESIMProfile::where('zendit_transaction_id', $transactionId)
            ->orWhere('order_no', $transactionId)
            ->first();

        if (!$profile) {
            Log::warning('Zendit webhook: Profile not found', [
                'transactionId' => $transactionId,
            ]);

            return [
                'action' => 'skipped',
                'reason' => 'profile_not_found',
            ];
        }

        // Check if this is a duplicate/stale update (idempotency)
        if ($profile->zendit_status === $zenditStatus) {
            Log::info('Zendit webhook: Status unchanged', [
                'transactionId' => $transactionId,
                'status' => $zenditStatus,
            ]);

            return [
                'action' => 'skipped',
                'reason' => 'status_unchanged',
            ];
        }

        // Update profile based on status
        $updateData = [
            'zendit_status' => $zenditStatus,
            'status' => $internalStatus,
        ];

        // Handle successful completion
        if ($zenditStatus === ZenditService::STATUS_DONE) {
            $updateData = array_merge($updateData, $this->extractCompletionData($payload));
        }

        // Handle failure
        if ($zenditStatus === ZenditService::STATUS_FAILED) {
            $error = $payload['error'] ?? null;
            if ($error) {
                $updateData['notes'] = json_encode([
                    'error_code' => $error['code'] ?? null,
                    'error_message' => $error['message'] ?? 'Unknown error',
                    'failed_at' => now()->toDateTimeString(),
                ]);
            }

            // Refund user wallet if purchase failed
            $this->handleFailedPurchase($profile);
        }

        $profile->update($updateData);

        // Also update related subscription if this is a top-up
        $this->updateRelatedSubscription($profile, $zenditStatus, $payload);

        // Send notification to user (if you have notification system)
        $this->notifyUser($profile, $zenditStatus);

        return [
            'action' => 'updated',
            'profile_id' => $profile->id,
            'old_status' => $profile->getOriginal('status'),
            'new_status' => $internalStatus,
        ];
    }

    /**
     * Extract completion data from successful webhook
     */
    protected function extractCompletionData(array $payload): array
    {
        $data = [
            'activated_at' => now(),
        ];

        // Extract confirmation details if present
        $confirmation = $payload['confirmation'] ?? [];

        if (!empty($confirmation['iccid'])) {
            $data['iccid'] = $confirmation['iccid'];
        }

        if (!empty($confirmation['smdpAddress'])) {
            $data['smdp_address'] = $confirmation['smdpAddress'];
        }

        if (!empty($confirmation['activationCode'])) {
            $data['activation_code'] = $confirmation['activationCode'];
        }

        // Build LPA string if we have the parts
        if (!empty($data['smdp_address']) && !empty($data['activation_code'])) {
            $data['qr_code_data'] = "LPA:1\${$data['smdp_address']}\${$data['activation_code']}";
        }

        // Calculate expiry date based on duration
        if (isset($payload['validityDays'])) {
            $data['duration_days'] = $payload['validityDays'];
            $data['expires_at'] = now()->addDays($payload['validityDays']);
        }

        return $data;
    }

    /**
     * Handle failed purchase - refund user wallet
     */
    protected function handleFailedPurchase(ESIMProfile $profile): void
    {
        // Only refund if status was pending/processing (not already failed)
        if (in_array($profile->status, ['pending', 'processing'])) {
            $user = $profile->user;

            if ($user && $profile->selling_price > 0) {
                Log::info('Zendit webhook: Refunding failed purchase', [
                    'profile_id' => $profile->id,
                    'user_id' => $user->id,
                    'amount' => $profile->selling_price,
                ]);

                // Add refund to user wallet
                $user->wallet_balance += $profile->selling_price;
                $user->save();

                // Record the refund transaction if you have a transactions table
                // WalletTransaction::create([...]);
            }
        }
    }

    /**
     * Update related subscription if this was a top-up
     */
    protected function updateRelatedSubscription(ESIMProfile $profile, string $zenditStatus, array $payload): void
    {
        // Check if there's a pending subscription matching this transaction
        $subscription = ESIMSubscription::where('esim_profile_id', $profile->id)
            ->where('zendit_transaction_id', $payload['transactionId'])
            ->where('status', '!=', 'active')
            ->first();

        if ($subscription) {
            $internalStatus = $this->zenditService->mapStatus($zenditStatus);

            $subscription->update([
                'status' => $internalStatus,
                'zendit_status' => $zenditStatus,
                'activated_at' => $zenditStatus === ZenditService::STATUS_DONE ? now() : null,
            ]);

            Log::info('Zendit webhook: Subscription updated', [
                'subscription_id' => $subscription->id,
                'status' => $internalStatus,
            ]);
        }
    }

    /**
     * Send notification to user about status change
     */
    protected function notifyUser(ESIMProfile $profile, string $status): void
    {
        // Placeholder for notification system
        // You can integrate with email, push notifications, etc.

        $user = $profile->user;

        if (!$user) {
            return;
        }

        $messages = [
            ZenditService::STATUS_DONE => 'Your eSIM is now active and ready to use!',
            ZenditService::STATUS_FAILED => 'Your eSIM purchase failed. A refund has been issued to your wallet.',
            ZenditService::STATUS_IN_PROGRESS => 'Your eSIM is being processed...',
        ];

        $message = $messages[$status] ?? null;

        if ($message) {
            Log::info('Zendit webhook: User notification', [
                'user_id' => $user->id,
                'profile_id' => $profile->id,
                'status' => $status,
                'message' => $message,
            ]);

            // TODO: Send actual notification
            // $user->notify(new ESIMStatusNotification($profile, $message));
        }
    }
}
