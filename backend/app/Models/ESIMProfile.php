<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ESIMProfile extends Model
{
    use HasFactory;

    protected $table = 'esim_profiles';

    protected $fillable = [
        'user_id',

        // Order identification
        'order_no',
        'zendit_transaction_id',

        // eSIM credentials
        'iccid',
        'qr_code_data',
        'qr_code_url',
        'qr_code_image',
        'smdp_address',
        'activation_code',
        'external_reference_id',

        // Package information
        'package_code',
        'offer_id',
        'country_code',
        'country_name',
        'data_amount',
        'duration_days',

        // Voice & SMS
        'voice_minutes',
        'voice_unlimited',
        'sms_number',
        'sms_unlimited',

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

        // References
        'transaction_reference',

        // Metadata
        'device_info',
        'notes',
        'redemption_instructions',
    ];

    protected $casts = [
        'data_amount' => 'decimal:2',
        'voice_minutes' => 'integer',
        'voice_unlimited' => 'boolean',
        'sms_number' => 'integer',
        'sms_unlimited' => 'boolean',
        'wholesale_price' => 'decimal:2',
        'cost_usd' => 'decimal:4',
        'price_usd' => 'decimal:4',
        'selling_price' => 'decimal:2',
        'profit' => 'decimal:2',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Get the user that owns this eSIM profile
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all subscriptions (data top-ups) for this eSIM
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(ESIMSubscription::class);
    }

    /**
     * Get active subscriptions
     */
    public function activeSubscriptions(): HasMany
    {
        return $this->subscriptions()->where('status', 'active');
    }

    /**
     * Check if eSIM is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active'
            && $this->expires_at
            && $this->expires_at->isFuture();
    }

    /**
     * Check if eSIM can be topped up
     */
    public function canTopUp(): bool
    {
        return in_array($this->status, ['new', 'active'])
            && (!$this->expires_at || $this->expires_at->isFuture());
    }

    /**
     * Get total data remaining across all active subscriptions
     */
    public function getTotalDataRemaining(): float
    {
        return $this->activeSubscriptions()->sum('data_remaining');
    }

    /**
     * Check if eSIM has voice capability
     */
    public function hasVoice(): bool
    {
        return $this->voice_unlimited || ($this->voice_minutes && $this->voice_minutes > 0);
    }

    /**
     * Check if eSIM has SMS capability
     */
    public function hasSms(): bool
    {
        return $this->sms_unlimited || ($this->sms_number && $this->sms_number > 0);
    }

    /**
     * Get formatted voice
     */
    public function getFormattedVoiceAttribute(): ?string
    {
        if ($this->voice_unlimited) {
            return 'Unlimited';
        }

        if ($this->voice_minutes) {
            return $this->voice_minutes . ' mins';
        }

        return null;
    }

    /**
     * Get formatted SMS
     */
    public function getFormattedSmsAttribute(): ?string
    {
        if ($this->sms_unlimited) {
            return 'Unlimited';
        }

        if ($this->sms_number) {
            return $this->sms_number . ' SMS';
        }

        return null;
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
     * Get the unique identifier (prefers zendit_transaction_id, falls back to order_no)
     */
    public function getTransactionIdAttribute(): string
    {
        return $this->zendit_transaction_id ?? $this->order_no;
    }

    /**
     * Check if this is a Zendit purchase
     */
    public function isZendit(): bool
    {
        return !empty($this->zendit_transaction_id) || !empty($this->offer_id);
    }

    /**
     * Get LPA activation string (for QR code)
     * Format: LPA:1$smdpAddress$activationCode
     */
    public function getLpaStringAttribute(): ?string
    {
        if ($this->qr_code_data) {
            return $this->qr_code_data;
        }

        if ($this->smdp_address && $this->activation_code) {
            return "LPA:1\${$this->smdp_address}\${$this->activation_code}";
        }

        return null;
    }

    /**
     * Scope to filter by status
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by country
     */
    public function scopeCountry($query, string $countryCode)
    {
        return $query->where('country_code', strtoupper($countryCode));
    }

    /**
     * Scope to get expiring soon (within days)
     */
    public function scopeExpiringSoon($query, int $days = 3)
    {
        return $query->where('status', 'active')
            ->whereBetween('expires_at', [now(), now()->addDays($days)]);
    }

    /**
     * Scope to filter Zendit purchases
     */
    public function scopeZendit($query)
    {
        return $query->whereNotNull('zendit_transaction_id');
    }

    /**
     * Scope to filter by Zendit status
     */
    public function scopeZenditStatus($query, string $status)
    {
        return $query->where('zendit_status', $status);
    }
}
