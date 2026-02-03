<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';

    public function isActive(): bool
    {
        return in_array($this, [self::PENDING, self::PROCESSING]);
    }

    public function isFinal(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::REFUNDED,
            self::CANCELLED,
            self::EXPIRED
        ]);
    }

    public function allowsRefund(): bool
    {
        return in_array($this, [self::PENDING, self::PROCESSING]);
    }

    public function allowsCancellation(): bool
    {
        return in_array($this, [self::PENDING, self::PROCESSING]);
    }
}
