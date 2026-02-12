<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmmService extends Model
{
    protected $fillable = [
        'category_id',
        'provider',
        'provider_service_id',
        'name',
        'description',
        'type',
        'cost_per_1000',
        'price_per_1000',
        'min_order',
        'max_order',
        'average_time_minutes',
        'refill_enabled',
        'refill_days',
        'cancel_enabled',
        'is_active',
        'sort_order',
        'metadata',
        'last_synced_at',
    ];

    protected $casts = [
        'cost_per_1000' => 'decimal:4',
        'price_per_1000' => 'decimal:2',
        'min_order' => 'decimal:2',
        'max_order' => 'decimal:2',
        'average_time_minutes' => 'integer',
        'refill_enabled' => 'boolean',
        'refill_days' => 'integer',
        'cancel_enabled' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'metadata' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(SmmCategory::class, 'category_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(SmmOrder::class, 'service_id');
    }

    public function calculatePrice(int $quantity): float
    {
        return round(($quantity / 1000) * $this->price_per_1000, 2);
    }

    public function calculateCost(int $quantity): float
    {
        return round(($quantity / 1000) * $this->cost_per_1000, 4);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }
}
