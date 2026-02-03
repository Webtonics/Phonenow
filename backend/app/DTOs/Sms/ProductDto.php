<?php

namespace App\DTOs\Sms;

readonly class ProductDto
{
    public function __construct(
        public string $code,
        public string $name,
        public int $quantity = 0,
        public float $basePrice = 0.0,
        public string $baseCurrency = 'USD',
        public ?string $category = null,
        public array $metadata = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            code: $data['code'],
            name: $data['name'],
            quantity: $data['quantity'] ?? 0,
            basePrice: $data['base_price'] ?? 0.0,
            baseCurrency: $data['base_currency'] ?? 'USD',
            category: $data['category'] ?? null,
            metadata: $data['metadata'] ?? [],
        );
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'display_name' => ucfirst(str_replace(['_', '-'], ' ', $this->name)),
            'quantity' => $this->quantity,
            'base_price' => $this->basePrice,
            'base_currency' => $this->baseCurrency,
            'category' => $this->category,
        ];
    }
}
