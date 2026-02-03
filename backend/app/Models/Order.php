<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'service_id',
        'order_number',
        'type',
        'status',
        'amount_paid',
        'provider',
        'provider_order_id',
        'provider_metadata',
        'phone_number',
        'product_name',
        'country_code',
        'operator',
        'sms_code',
        'sms_text',
        'smm_link',
        'smm_quantity',
        'smm_start_count',
        'smm_remains',
        'completed_at',
        'expires_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid' => 'decimal:2',
            'smm_quantity' => 'integer',
            'smm_start_count' => 'integer',
            'smm_remains' => 'integer',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
            'provider_metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePhoneNumbers($query)
    {
        return $query->where('type', 'phone_number');
    }

    public function scopeSmm($query)
    {
        return $query->where('type', 'smm');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'processing']);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    public static function generateOrderNumber(int $userId): string
    {
        $date = now()->format('Ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return "ORD_{$date}_{$userId}_" . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}
