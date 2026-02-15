<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmmOrder extends Model
{
    protected $fillable = [
        'user_id',
        'service_id',
        'reference',
        'provider',
        'provider_order_id',
        'link',
        'quantity',
        'amount',
        'cost',
        'status',
        'start_count',
        'remains',
        'status_message',
        'admin_notes',
        'transaction_id',
        'balance_before',
        'balance_after',
        'provider_created_at',
        'completed_at',
        'fulfilled_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'amount' => 'decimal:2',
        'cost' => 'decimal:4',
        'start_count' => 'integer',
        'remains' => 'integer',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'provider_created_at' => 'datetime',
        'completed_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    public static function generateReference(): string
    {
        return 'SMM-' . strtoupper(uniqid());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(SmmService::class, 'service_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    public function isAwaitingFulfillment(): bool
    {
        return $this->status === 'awaiting_fulfillment';
    }

    public function isRefundable(): bool
    {
        return in_array($this->status, ['cancelled', 'failed', 'partial']);
    }

    public function getProgressPercentage(): int
    {
        if ($this->status === 'completed') {
            return 100;
        }

        if ($this->start_count === null || $this->remains === null) {
            return 0;
        }

        $delivered = $this->quantity - $this->remains;
        return (int) (($delivered / $this->quantity) * 100);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeProcessing($query)
    {
        return $query->whereIn('status', ['processing', 'in_progress']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeAwaitingFulfillment($query)
    {
        return $query->where('status', 'awaiting_fulfillment');
    }
}
