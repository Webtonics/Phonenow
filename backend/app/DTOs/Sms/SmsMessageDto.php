<?php

namespace App\DTOs\Sms;

readonly class SmsMessageDto
{
    public function __construct(
        public ?string $code,
        public string $text,
        public ?string $sender = null,
        public ?string $receivedAt = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            code: $data['code'] ?? null,
            text: $data['text'] ?? '',
            sender: $data['sender'] ?? null,
            receivedAt: $data['received_at'] ?? $data['created_at'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'text' => $this->text,
            'sender' => $this->sender,
            'received_at' => $this->receivedAt,
        ];
    }
}
