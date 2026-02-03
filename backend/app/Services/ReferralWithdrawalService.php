<?php

namespace App\Services;

use App\Models\User;
use App\Models\ReferralWithdrawal;
use Illuminate\Support\Facades\DB;
use Exception;

class ReferralWithdrawalService
{
    public function requestWithdrawal(User $user, float $amount): array
    {
        try {
            $canWithdraw = ReferralFraudService::canWithdraw($user->id);

            if (!$canWithdraw['can_withdraw']) {
                return [
                    'success' => false,
                    'message' => $canWithdraw['reason'],
                ];
            }

            $minAmount = config('referral.min_withdrawal_amount', 5000);
            if ($amount < $minAmount) {
                return [
                    'success' => false,
                    'message' => "Minimum withdrawal amount is ₦{$minAmount}",
                ];
            }

            $referralService = new ReferralService();
            $stats = $referralService->getReferralStats($user->id);

            if ($amount > $stats['available_to_withdraw']) {
                return [
                    'success' => false,
                    'message' => 'Insufficient balance for withdrawal',
                ];
            }

            DB::beginTransaction();

            $withdrawal = ReferralWithdrawal::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'status' => 'pending',
                'reference' => 'REF_WD_' . strtoupper(uniqid()),
                'requested_at' => now(),
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Withdrawal request submitted successfully. Our team will process it within 24-48 hours.',
                'data' => [
                    'withdrawal_id' => $withdrawal->id,
                    'amount' => $amount,
                    'status' => 'pending',
                    'reference' => $withdrawal->reference,
                ],
            ];
        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Failed to process withdrawal request: ' . $e->getMessage(),
            ];
        }
    }

    public function getWithdrawalRequests(User $user): array
    {
        $withdrawals = ReferralWithdrawal::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return [
            'success' => true,
            'data' => $withdrawals,
        ];
    }
}
