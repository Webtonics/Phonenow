<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReferralFraudService
{
    public static function isSelfReferral(int $userId, string $referralCode): bool
    {
        $user = User::find($userId);
        if (!$user) {
            return false;
        }

        return $user->referral_code === $referralCode;
    }

    public static function hasMultipleAccountsFromIP(string $ipAddress): bool
    {
        $signupsInLast24Hours = DB::table('users')
            ->where('created_at', '>=', Carbon::now()->subHours(24))
            ->where('last_login_ip', $ipAddress)
            ->count();

        return $signupsInLast24Hours > 3;
    }

    public static function canWithdraw(int $userId): array
    {
        $user = User::find($userId);

        if (!$user) {
            return ['can_withdraw' => false, 'reason' => 'User not found'];
        }

        $accountAge = Carbon::parse($user->created_at)->diffInDays(Carbon::now());
        if ($accountAge < 7) {
            return ['can_withdraw' => false, 'reason' => 'Account must be at least 7 days old'];
        }

        if (!$user->email_verified) {
            return ['can_withdraw' => false, 'reason' => 'Email must be verified'];
        }

        $minAmount = config('referral.min_withdrawal_amount', 5000);
        $availableBalance = $user->commissions()->where('status', 'paid')->sum('commission_amount');

        if ($availableBalance < $minAmount) {
            return ['can_withdraw' => false, 'reason' => "Minimum withdrawal amount is ₦{$minAmount}"];
        }

        return ['can_withdraw' => true, 'reason' => ''];
    }
}
