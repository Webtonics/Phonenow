<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopProductStock extends Model
{
    protected $table = 'shop_product_stock';

    protected $fillable = [
        'product_id',
        'activation_code',
        'is_used',
        'used_at',
        'order_id',
    ];

    protected $casts = [
        'activation_code' => 'encrypted',
        'is_used' => 'boolean',
        'used_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(ShopProduct::class, 'product_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(ShopOrder::class, 'order_id');
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_used', false);
    }
}
