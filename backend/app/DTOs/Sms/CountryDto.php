<?php

namespace App\DTOs\Sms;

readonly class CountryDto
{
    public function __construct(
        public string $code,
        public string $name,
        public string $prefix = '',
        public ?string $iso = null,
        public ?string $flag = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            code: $data['code'],
            name: $data['name'],
            prefix: $data['prefix'] ?? '',
            iso: $data['iso'] ?? null,
            flag: $data['flag'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'code' => $this->code,
            'name' => $this->name,
            'text_en' => $this->name, // Alias for frontend compatibility
            'prefix' => $this->prefix,
            'iso' => $this->iso,
            'flag' => $this->flag,
        ];
    }
}
