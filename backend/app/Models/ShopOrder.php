<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShopOrder extends Model
{
    protected $table = 'shop_orders';

    protected $fillable = [
        'user_id',
        'product_id',
        'transaction_id',
        'reference',
        'amount_paid',
        'balance_before',
        'balance_after',
        'status',
        'activation_code',
        'activation_instructions',
        'admin_notes',
        'fulfilled_at',
        'cancelled_at',
    ];

    protected $casts = [
        'activation_code' => 'encrypted',
        'amount_paid' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'fulfilled_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $hidden = [
        'activation_code',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(ShopProduct::class, 'product_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeFulfilled($query)
    {
        return $query->where('status', 'fulfilled');
    }

    public static function generateReference(): string
    {
        return 'SHOP-' . strtoupper(uniqid());
    }
}
