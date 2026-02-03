<?php

return [
    'signup_bonus' => env('REFERRAL_SIGNUP_BONUS', 500),
    'commission_rate_first_3' => env('REFERRAL_COMMISSION_FIRST_3', 10),
    'commission_rate_after' => env('REFERRAL_COMMISSION_AFTER', 5),
    'first_purchases_count' => 3,
    'min_withdrawal_amount' => env('REFERRAL_MIN_WITHDRAWAL', 5000),
    'auto_add_to_wallet_threshold' => 5000,
];
