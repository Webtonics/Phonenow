<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'name',
        'provider',
        'provider_service_code',
        'cost_price',
        'retail_price',
        'reseller_price',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'retail_price' => 'decimal:2',
            'reseller_price' => 'decimal:2',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function getPriceForUser(User $user): float
    {
        if ($user->isReseller() && $this->reseller_price) {
            return (float) $this->reseller_price;
        }
        return (float) $this->retail_price;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePhoneNumbers($query)
    {
        return $query->where('category', 'phone_number');
    }

    public function scopeSmm($query)
    {
        return $query->where('category', 'smm');
    }

    public function scopeByCountry($query, string $country)
    {
        return $query->whereJsonContains('metadata->country', $country);
    }
}
