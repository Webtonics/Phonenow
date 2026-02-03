<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReferralCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'code',
        'total_referrals',
        'total_earnings',
        'is_active',
    ];

    protected $casts = [
        'total_earnings' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function referrals(): HasMany
    {
        return $this->hasMany(Referral::class, 'referral_code', 'code');
    }

    public function incrementReferrals(): void
    {
        $this->increment('total_referrals');
    }

    public function incrementEarnings(float $amount): void
    {
        $this->increment('total_earnings', $amount);
    }
}
