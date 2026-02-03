<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ESIMSubscription extends Model
{
    use HasFactory;

    protected $table = 'esim_subscriptions';

    protected $fillable = [
        'esim_profile_id',
        'user_id',

        // Zendit fields
        'zendit_transaction_id',
        'offer_id',

        // Package info
        'package_code',
        'order_no',
        'data_amount',
        'duration_days',
        'data_used',
        'data_remaining',

        // Pricing
        'wholesale_price',
        'cost_usd',
        'price_usd',
        'selling_price',
        'profit',

        // Status
        'status',
        'zendit_status',
        'activated_at',
        'expires_at',
        'last_usage_check',

        // Reference
        'transaction_reference',
    ];

    protected $casts = [
        'data_amount' => 'decimal:2',
        'data_used' => 'decimal:2',
        'data_remaining' => 'decimal:2',
        'wholesale_price' => 'decimal:2',
        'cost_usd' => 'decimal:4',
        'price_usd' => 'decimal:4',
        'selling_price' => 'decimal:2',
        'profit' => 'decimal:2',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_usage_check' => 'datetime',
    ];

    /**
     * Get the eSIM profile this subscription belongs to
     */
    public function profile(): BelongsTo
    {
        return $this->belongsTo(ESIMProfile::class, 'esim_profile_id');
    }

    /**
     * Get the user who purchased this subscription
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if subscription is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active'
            && $this->expires_at
            && $this->expires_at->isFuture();
    }

    /**
     * Check if subscription is expired
     */
    public function isExpired(): bool
    {
        return $this->status === 'expired'
            || ($this->expires_at && $this->expires_at->isPast());
    }

    /**
     * Get data usage percentage
     */
    public function getUsagePercentage(): float
    {
        if ($this->data_amount == 0) {
            return 0;
        }

        return ($this->data_used / $this->data_amount) * 100;
    }

    /**
     * Check if data is running low
     */
    public function isDataLow(int $threshold = 20): bool
    {
        if ($this->data_amount == 0) {
            return false;
        }

        $remaining = ($this->data_remaining / $this->data_amount) * 100;
        return $remaining <= $threshold && $remaining > 0;
    }

    /**
     * Get formatted data amount
     */
    public function getFormattedDataAttribute(): string
    {
        $mb = $this->data_amount;

        if ($mb >= 1024) {
            return round($mb / 1024, 1) . ' GB';
        }

        return $mb . ' MB';
    }

    /**
     * Get formatted data remaining
     */
    public function getFormattedRemainingAttribute(): string
    {
        $mb = $this->data_remaining;

        if ($mb >= 1024) {
            return round($mb / 1024, 1) . ' GB';
        }

        return round($mb) . ' MB';
    }

    /**
     * Check if this is a Zendit subscription
     */
    public function isZendit(): bool
    {
        return !empty($this->zendit_transaction_id) || !empty($this->offer_id);
    }

    /**
     * Scope to filter active subscriptions
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('expires_at', '>', now());
    }

    /**
     * Scope to get expiring soon subscriptions
     */
    public function scopeExpiringSoon($query, int $days = 3)
    {
        return $query->where('status', 'active')
            ->whereBetween('expires_at', [now(), now()->addDays($days)]);
    }

    /**
     * Scope to get low data subscriptions
     */
    public function scopeLowData($query, int $threshold = 20)
    {
        return $query->where('status', 'active')
            ->whereRaw('(data_remaining / data_amount * 100) <= ?', [$threshold])
            ->whereRaw('(data_remaining / data_amount * 100) > 0');
    }

    /**
     * Scope to filter Zendit subscriptions
     */
    public function scopeZendit($query)
    {
        return $query->whereNotNull('zendit_transaction_id');
    }
}
