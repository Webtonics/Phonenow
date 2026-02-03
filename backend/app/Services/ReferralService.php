<?php

namespace App\Services;

use App\Models\User;
use App\Models\Referral;
use App\Models\ReferralCode;
use App\Models\ReferralCommission;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Exception;

class ReferralService
{
    public function processSignup(User $user, string $referralCode): array
    {
        try {
            DB::beginTransaction();

            $referrer = User::where('referral_code', $referralCode)->first();

            if (!$referrer) {
                return ['success' => false, 'message' => 'Invalid referral code'];
            }

            if ($referrer->id === $user->id) {
                return ['success' => false, 'message' => 'Cannot use your own referral code'];
            }

            if ($user->signup_bonus_claimed) {
                return ['success' => false, 'message' => 'Signup bonus already claimed'];
            }

            $referral = Referral::create([
                'referrer_id' => $referrer->id,
                'referee_id' => $user->id,
                'referral_code' => $referralCode,
                'status' => 'active',
            ]);

            $referrerCode = ReferralCode::where('code', $referralCode)->first();
            if ($referrerCode) {
                $referrerCode->incrementReferrals();
            }

            $signupBonus = config('referral.signup_bonus', 500);
            $user->addBalance($signupBonus);
            $user->update([
                'referred_by_code' => $referralCode,
                'signup_bonus_claimed' => true,
            ]);

            Transaction::create([
                'user_id' => $user->id,
                'type' => 'credit',
                'amount' => $signupBonus,
                'balance_before' => $user->balance - $signupBonus,
                'balance_after' => $user->balance,
                'status' => 'completed',
                'description' => 'Referral signup bonus',
                'reference' => 'REF_SIGNUP_' . strtoupper(uniqid()),
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => "Welcome! ₦{$signupBonus} bonus added to your wallet",
                'bonus_amount' => $signupBonus,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            return ['success' => false, 'message' => 'Failed to process referral: ' . $e->getMessage()];
        }
    }

    public function processCommission($transaction, int $userId): ?float
    {
        try {
            $user = User::find($userId);
            if (!$user || !$user->referred_by_code) {
                return null;
            }

            $referral = Referral::where('referee_id', $userId)->first();
            if (!$referral || $referral->status !== 'active') {
                return null;
            }

            $commissionRate = $this->getCommissionRate($referral->purchase_count);
            $transactionAmount = is_object($transaction) ? $transaction->amount : $transaction;
            $commissionAmount = ($transactionAmount * $commissionRate) / 100;

            DB::beginTransaction();

            $commission = ReferralCommission::create([
                'referral_id' => $referral->id,
                'referrer_id' => $referral->referrer_id,
                'referee_id' => $userId,
                'transaction_id' => is_object($transaction) ? $transaction->id : null,
                'transaction_type' => is_object($transaction) ? get_class($transaction) : 'purchase',
                'transaction_amount' => $transactionAmount,
                'commission_rate' => $commissionRate,
                'commission_amount' => $commissionAmount,
                'status' => 'paid',
                'paid_at' => now(),
            ]);

            $referrer = User::find($referral->referrer_id);
            if ($referrer) {
                $referrer->addBalance($commissionAmount);

                Transaction::create([
                    'user_id' => $referrer->id,
                    'type' => 'credit',
                    'amount' => $commissionAmount,
                    'balance_before' => $referrer->balance - $commissionAmount,
                    'balance_after' => $referrer->balance,
                    'status' => 'completed',
                    'description' => "Referral commission ({$commissionRate}%) from {$user->name}",
                    'reference' => 'REF_COMM_' . strtoupper(uniqid()),
                ]);
            }

            $referral->incrementPurchaseCount();
            $referral->increment('total_commission_earned', $commissionAmount);

            $referrerCode = ReferralCode::where('code', $referral->referral_code)->first();
            if ($referrerCode) {
                $referrerCode->incrementEarnings($commissionAmount);
            }

            DB::commit();

            return $commissionAmount;
        } catch (Exception $e) {
            DB::rollBack();
            \Log::error('Referral commission processing failed: ' . $e->getMessage());
            return null;
        }
    }

    public function getCommissionRate(int $purchaseCount): float
    {
        if ($purchaseCount < config('referral.first_purchases_count', 3)) {
            return config('referral.commission_rate_first_3', 10);
        }
        return config('referral.commission_rate_after', 5);
    }

    public function getReferralStats(int $userId): array
    {
        $user = User::find($userId);
        if (!$user) {
            return [];
        }

        $totalReferrals = Referral::where('referrer_id', $userId)->count();
        $activeReferrals = Referral::where('referrer_id', $userId)->where('status', 'active')->count();

        $totalEarned = ReferralCommission::where('referrer_id', $userId)
            ->where('status', 'paid')
            ->sum('commission_amount');

        $pendingEarnings = ReferralCommission::where('referrer_id', $userId)
            ->where('status', 'pending')
            ->sum('commission_amount');

        $availableToWithdraw = $totalEarned;

        return [
            'total_referrals' => $totalReferrals,
            'active_referrals' => $activeReferrals,
            'total_earned' => (float) $totalEarned,
            'pending_earnings' => (float) $pendingEarnings,
            'available_to_withdraw' => (float) $availableToWithdraw,
        ];
    }
}
