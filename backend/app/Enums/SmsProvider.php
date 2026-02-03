<?php

namespace App\Enums;

enum SmsProvider: string
{
    case FIVESIM = '5sim';
    case GRIZZLYSMS = 'grizzlysms';

    public function displayName(): string
    {
        return match ($this) {
            self::FIVESIM => '5SIM',
            self::GRIZZLYSMS => 'GrizzlySMS',
        };
    }

    public function baseCurrency(): string
    {
        return match ($this) {
            self::FIVESIM => 'RUB',
            self::GRIZZLYSMS => 'USD',
        };
    }
}
