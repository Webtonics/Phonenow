<?php

namespace App\DTOs\Sms;

use DateTimeInterface;
use DateTimeImmutable;

readonly class PurchaseResultDto
{
    public function __construct(
        public bool $success,
        public ?string $providerOrderId = null,
        public ?string $phone = null,
        public ?string $operator = null,
        public ?string $product = null,
        public ?float $price = null,
        public ?string $status = null,
        public ?string $country = null,
        public ?DateTimeInterface $expiresAt = null,
        public ?string $errorMessage = null,
        public ?string $errorCode = null,
    ) {}

    public static function success(array $data): self
    {
        $expiresAt = null;
        if (isset($data['expires'])) {
            try {
                $expiresAt = new DateTimeImmutable($data['expires']);
            } catch (\Exception $e) {
                $expiresAt = null;
            }
        }

        return new self(
            success: true,
            providerOrderId: (string) $data['order_id'],
            phone: $data['phone'] ?? null,
            operator: $data['operator'] ?? null,
            product: $data['product'] ?? null,
            price: isset($data['price']) ? (float) $data['price'] : null,
            status: $data['status'] ?? 'pending',
            country: $data['country'] ?? null,
            expiresAt: $expiresAt,
        );
    }

    public static function failure(string $message, ?string $code = null): self
    {
        return new self(
            success: false,
            errorMessage: $message,
            errorCode: $code,
        );
    }
}
