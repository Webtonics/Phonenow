<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShopProduct extends Model
{
    protected $fillable = [
        'name',
        'description',
        'category',
        'duration_days',
        'duration_label',
        'wholesale_cost',
        'selling_price',
        'stock_count',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'wholesale_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'stock_count' => 'integer',
        'duration_days' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(ShopOrder::class, 'product_id');
    }

    public function stock(): HasMany
    {
        return $this->hasMany(ShopProductStock::class, 'product_id');
    }

    public function getAvailableStockAttribute(): int
    {
        return $this->stock()->where('is_used', false)->count();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
