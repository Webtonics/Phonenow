<?php

namespace App\DTOs\Sms;

readonly class PriceDto
{
    public function __construct(
        public string $operator,
        public float $cost = 0.0,
        public string $currency = 'USD',
        public int $available = 0,
        public ?float $successRate = null,
        public ?string $provider = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            operator: $data['operator'],
            cost: $data['cost'] ?? 0.0,
            currency: $data['currency'] ?? 'USD',
            available: $data['available'] ?? 0,
            successRate: $data['success_rate'] ?? null,
            provider: $data['provider'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'operator' => $this->operator,
            'cost' => $this->cost,
            'currency' => $this->currency,
            'available' => $this->available,
            'success_rate' => $this->successRate,
            'provider' => $this->provider,
        ];
    }
}
