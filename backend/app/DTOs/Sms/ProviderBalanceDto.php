<?php

namespace App\DTOs\Sms;

readonly class ProviderBalanceDto
{
    public function __construct(
        public bool $success,
        public float $balance = 0.0,
        public string $currency = 'USD',
        public ?string $errorMessage = null,
    ) {}

    public static function success(float $balance, string $currency = 'USD'): self
    {
        return new self(
            success: true,
            balance: $balance,
            currency: $currency,
        );
    }

    public static function failure(string $message): self
    {
        return new self(
            success: false,
            errorMessage: $message,
        );
    }
}
