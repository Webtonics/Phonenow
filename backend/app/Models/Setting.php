<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'description',
    ];

    /**
     * Get a setting value by key
     */
    public static function getValue(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember("setting:{$key}", 3600, function () use ($key) {
            return self::where('key', $key)->first();
        });

        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value
     */
    public static function setValue(string $key, mixed $value, string $type = 'string', string $group = 'general', ?string $description = null): void
    {
        $setting = self::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_array($value) ? json_encode($value) : (string) $value,
                'type' => $type,
                'group' => $group,
                'description' => $description,
            ]
        );

        Cache::forget("setting:{$key}");
        Cache::forget("settings:group:{$group}");
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup(string $group): array
    {
        return Cache::remember("settings:group:{$group}", 3600, function () use ($group) {
            $settings = self::where('group', $group)->get();

            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = self::castValue($setting->value, $setting->type);
            }

            return $result;
        });
    }

    /**
     * Cast value to appropriate type
     */
    protected static function castValue(?string $value, string $type): mixed
    {
        if ($value === null) {
            return null;
        }

        return match ($type) {
            'integer', 'int' => (int) $value,
            'float', 'double' => (float) $value,
            'boolean', 'bool' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json', 'array' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $settings = self::all();
        foreach ($settings as $setting) {
            Cache::forget("setting:{$setting->key}");
        }

        $groups = self::distinct()->pluck('group');
        foreach ($groups as $group) {
            Cache::forget("settings:group:{$group}");
        }
    }

    /**
     * Get default pricing settings
     */
    public static function getDefaultPricingSettings(): array
    {
        return [
            'phone_markup_percentage' => 1000, // 1000% = 10x
            'phone_exchange_rate' => 20, // 1 RUB = 20 NGN
            'phone_min_price' => 500, // Minimum ₦500 per number
            'phone_platform_fee' => 0, // Additional flat fee
            'smm_markup_percentage' => 500, // 500% = 5x for SMM
        ];
    }

    /**
     * Initialize default settings
     */
    public static function initializeDefaults(): void
    {
        $defaults = [
            // Pricing settings
            [
                'key' => 'phone_markup_percentage',
                'value' => '1000',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for phone numbers (1000 = 10x cost)',
            ],
            [
                'key' => 'phone_exchange_rate',
                'value' => '20',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Exchange rate from RUB to NGN',
            ],
            [
                'key' => 'phone_min_price',
                'value' => '500',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Minimum price per phone number in NGN',
            ],
            [
                'key' => 'phone_platform_fee',
                'value' => '0',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Additional flat platform fee per transaction in NGN',
            ],
            [
                'key' => 'smm_markup_percentage',
                'value' => '500',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for SMM services (500 = 5x cost)',
            ],
            // General settings
            [
                'key' => 'site_name',
                'value' => 'PhoneNow',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Site name',
            ],
            [
                'key' => 'support_email',
                'value' => 'support@phonenow.ng',
                'type' => 'string',
                'group' => 'general',
                'description' => 'Support email address',
            ],
            [
                'key' => 'min_deposit',
                'value' => '1000',
                'type' => 'float',
                'group' => 'payment',
                'description' => 'Minimum deposit amount in NGN',
            ],
            [
                'key' => 'max_deposit',
                'value' => '1000000',
                'type' => 'float',
                'group' => 'payment',
                'description' => 'Maximum deposit amount in NGN',
            ],
        ];

        foreach ($defaults as $setting) {
            self::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
