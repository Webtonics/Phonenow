<?php

namespace App\DTOs\Sms;

readonly class OrderStatusDto
{
    /**
     * @param SmsMessageDto[] $sms
     */
    public function __construct(
        public bool $success,
        public ?string $providerOrderId = null,
        public ?string $phone = null,
        public ?string $status = null,
        public ?string $mappedStatus = null,
        public array $sms = [],
        public ?string $errorMessage = null,
    ) {}

    public static function success(array $data, string $mappedStatus): self
    {
        $smsMessages = [];
        foreach (($data['sms'] ?? []) as $msg) {
            $smsMessages[] = new SmsMessageDto(
                code: $msg['code'] ?? null,
                text: $msg['text'] ?? '',
                sender: $msg['sender'] ?? null,
                receivedAt: $msg['created_at'] ?? $msg['date'] ?? null,
            );
        }

        return new self(
            success: true,
            providerOrderId: isset($data['order_id']) ? (string) $data['order_id'] : null,
            phone: $data['phone'] ?? null,
            status: $data['status'] ?? null,
            mappedStatus: $mappedStatus,
            sms: $smsMessages,
        );
    }

    public static function failure(string $message): self
    {
        return new self(
            success: false,
            errorMessage: $message,
        );
    }

    public function hasReceivedSms(): bool
    {
        return !empty($this->sms);
    }

    public function getLatestCode(): ?string
    {
        if (empty($this->sms)) {
            return null;
        }
        $lastSms = end($this->sms);
        return $lastSms->code;
    }

    public function getLatestText(): ?string
    {
        if (empty($this->sms)) {
            return null;
        }
        $lastSms = end($this->sms);
        return $lastSms->text;
    }
}
