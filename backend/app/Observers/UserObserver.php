<?php

namespace App\Observers;

use App\Models\User;
use App\Models\ReferralCode;
use Illuminate\Support\Str;

class UserObserver
{
    public function created(User $user): void
    {
        if (!$user->referral_code) {
            do {
                $code = strtoupper(Str::random(8));
            } while (User::where('referral_code', $code)->exists());

            $user->update(['referral_code' => $code]);

            ReferralCode::create([
                'user_id' => $user->id,
                'code' => $code,
            ]);
        }
    }
}
