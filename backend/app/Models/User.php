<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'balance',
        'api_key',
        'is_active',
        'email_verified',
        'last_login_at',
        'referral_code',
        'referred_by_code',
        'signup_bonus_claimed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'balance' => 'decimal:2',
            'is_active' => 'boolean',
            'email_verified' => 'boolean',
            'signup_bonus_claimed' => 'boolean',
        ];
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function esimProfiles(): HasMany
    {
        return $this->hasMany(ESIMProfile::class);
    }

    public function esimSubscriptions(): HasMany
    {
        return $this->hasMany(ESIMSubscription::class);
    }

    public function emailVerifications(): HasMany
    {
        return $this->hasMany(EmailVerification::class);
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isReseller(): bool
    {
        return $this->role === 'reseller';
    }

    public function hasBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    public function deductBalance(float $amount): bool
    {
        if (!$this->hasBalance($amount)) {
            return false;
        }
        $this->balance -= $amount;
        $this->save();
        return true;
    }

    public function addBalance(float $amount): void
    {
        $this->balance += $amount;
        $this->save();
    }

    public function referralCode(): HasOne
    {
        return $this->hasOne(ReferralCode::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referrer_id');
    }

    public function referredBy(): HasOne
    {
        return $this->hasOne(Referral::class, 'referee_id');
    }

    public function commissions(): HasManyThrough
    {
        return $this->hasManyThrough(ReferralCommission::class, Referral::class, 'referrer_id', 'referral_id');
    }

    public function generateReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (User::where('referral_code', $code)->exists());

        $this->update(['referral_code' => $code]);

        ReferralCode::create([
            'user_id' => $this->id,
            'code' => $code,
        ]);

        return $code;
    }

    public function getReferralLink(): string
    {
        $baseUrl = config('app.frontend_url', config('app.url'));
        return $baseUrl . '/register?ref=' . $this->referral_code;
    }

    public function getTotalReferralEarnings(): float
    {
        return $this->commissions()->where('status', 'paid')->sum('commission_amount');
    }
}
