<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ESIMPackage extends Model
{
    use HasFactory;

    protected $table = 'esim_packages';

    protected $fillable = [
        // Identification
        'package_code',
        'offer_id',
        'brand',
        'country_code',
        'country_name',
        'region',
        'regions',

        // Data
        'data_amount',
        'data_gb',
        'data_unlimited',
        'duration_days',
        'network_type',
        'data_speeds',

        // Voice & SMS
        'voice_minutes',
        'voice_unlimited',
        'sms_number',
        'sms_unlimited',

        // Coverage
        'roaming_countries',

        // Pricing
        'wholesale_price',
        'price_usd',
        'price_currency',
        'selling_price',
        'markup_percentage',

        // Classification
        'package_type',
        'price_type',
        'product_type',
        'provider',

        // Tracking
        'purchase_count',
        'is_popular',
        'is_active',
        'last_synced_at',
    ];

    protected $casts = [
        'data_amount' => 'decimal:2',
        'data_gb' => 'decimal:4',
        'data_unlimited' => 'boolean',
        'voice_minutes' => 'integer',
        'voice_unlimited' => 'boolean',
        'sms_number' => 'integer',
        'sms_unlimited' => 'boolean',
        'roaming_countries' => 'array',
        'data_speeds' => 'array',
        'regions' => 'array',
        'wholesale_price' => 'decimal:2',
        'price_usd' => 'decimal:4',
        'selling_price' => 'decimal:2',
        'markup_percentage' => 'decimal:2',
        'purchase_count' => 'integer',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    /**
     * Calculate selling price based on wholesale price and markup
     */
    public static function calculateSellingPrice(float $wholesalePrice, float $markupPercentage): float
    {
        return $wholesalePrice * (1 + ($markupPercentage / 100));
    }

    /**
     * Update selling price based on current markup
     */
    public function updateSellingPrice(): void
    {
        $this->selling_price = self::calculateSellingPrice(
            $this->wholesale_price,
            $this->markup_percentage
        );
        $this->save();
    }

    /**
     * Increment purchase count
     */
    public function incrementPurchases(): void
    {
        $this->increment('purchase_count');

        // Auto-mark as popular if purchased enough times
        if ($this->purchase_count >= 10 && !$this->is_popular) {
            $this->update(['is_popular' => true]);
        }
    }

    /**
     * Get formatted data amount (e.g., "1 GB", "500 MB", "Unlimited")
     */
    public function getFormattedDataAttribute(): string
    {
        if ($this->data_unlimited) {
            return 'Unlimited';
        }

        // Use data_gb if available (Zendit format)
        if ($this->data_gb !== null && $this->data_gb > 0) {
            if ($this->data_gb >= 1) {
                return round($this->data_gb, 1) . ' GB';
            }
            return round($this->data_gb * 1024) . ' MB';
        }

        // Fallback to data_amount in MB
        $mb = $this->data_amount;
        if ($mb >= 1024) {
            return round($mb / 1024, 1) . ' GB';
        }

        return $mb . ' MB';
    }

    /**
     * Get formatted duration (e.g., "7 days", "30 days")
     */
    public function getFormattedDurationAttribute(): string
    {
        return $this->duration_days . ' ' . ($this->duration_days === 1 ? 'day' : 'days');
    }

    /**
     * Get formatted voice (e.g., "100 mins", "Unlimited")
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
     * Get formatted SMS (e.g., "50 SMS", "Unlimited")
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
     * Get formatted data speeds (e.g., "4G/5G")
     */
    public function getFormattedSpeedsAttribute(): string
    {
        if (is_array($this->data_speeds) && !empty($this->data_speeds)) {
            return implode('/', $this->data_speeds);
        }

        return $this->network_type ?? '4G';
    }

    /**
     * Check if package has voice
     */
    public function hasVoice(): bool
    {
        return $this->voice_unlimited || ($this->voice_minutes && $this->voice_minutes > 0);
    }

    /**
     * Check if package has SMS
     */
    public function hasSms(): bool
    {
        return $this->sms_unlimited || ($this->sms_number && $this->sms_number > 0);
    }

    /**
     * Check if package supports roaming
     */
    public function hasRoaming(): bool
    {
        return is_array($this->roaming_countries) && count($this->roaming_countries) > 0;
    }

    /**
     * Get the unique identifier (prefers offer_id for Zendit, falls back to package_code)
     */
    public function getIdentifierAttribute(): string
    {
        return $this->offer_id ?? $this->package_code;
    }

    /**
     * Scope to filter active packages
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by country
     */
    public function scopeCountry($query, string $countryCode)
    {
        return $query->where('country_code', strtoupper($countryCode));
    }

    /**
     * Scope to filter by region
     */
    public function scopeRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    /**
     * Scope to filter popular packages
     */
    public function scopePopular($query)
    {
        return $query->where('is_popular', true);
    }

    /**
     * Scope to filter by package type
     */
    public function scopeType($query, string $type)
    {
        return $query->where('package_type', $type);
    }

    /**
     * Scope to get profile packages (initial eSIM purchase)
     */
    public function scopeProfiles($query)
    {
        return $query->where('package_type', 'profile');
    }

    /**
     * Scope to get topup packages (data bundles)
     */
    public function scopeTopups($query)
    {
        return $query->where('package_type', 'topup');
    }

    /**
     * Scope to filter by provider
     */
    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    /**
     * Scope for Zendit packages
     */
    public function scopeZendit($query)
    {
        return $query->where('provider', 'zendit');
    }

    /**
     * Scope to search by country name or code
     */
    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('country_name', 'like', '%' . $search . '%')
              ->orWhere('country_code', 'like', '%' . $search . '%')
              ->orWhere('region', 'like', '%' . $search . '%')
              ->orWhere('brand', 'like', '%' . $search . '%');
        });
    }

    /**
     * Scope to order by popularity
     */
    public function scopeOrderByPopularity($query)
    {
        return $query->orderByDesc('is_popular')
            ->orderByDesc('purchase_count');
    }

    /**
     * Scope to filter packages with voice
     */
    public function scopeWithVoice($query)
    {
        return $query->where(function ($q) {
            $q->where('voice_unlimited', true)
              ->orWhere('voice_minutes', '>', 0);
        });
    }

    /**
     * Scope to filter packages with SMS
     */
    public function scopeWithSms($query)
    {
        return $query->where(function ($q) {
            $q->where('sms_unlimited', true)
              ->orWhere('sms_number', '>', 0);
        });
    }
}
