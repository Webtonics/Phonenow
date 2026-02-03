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
            'usd_to_ngn_rate' => 1600, // 1 USD = 1600 NGN (manual exchange rate)
            'phone_markup_percentage' => 200, // 200% = 2x markup on cost
            'phone_min_price' => 500, // Minimum ₦500 per number
            'phone_platform_fee' => 0, // Additional flat fee
        ];
    }

    /**
     * Initialize default settings
     */
    public static function initializeDefaults(): void
    {
        $defaults = [
            // Exchange Rate (USD to NGN) - MANUAL ONLY
            [
                'key' => 'usd_to_ngn_rate',
                'value' => '1600',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'USD to NGN exchange rate (e.g., 1600 means 1 USD = ₦1600)',
            ],
            // Phone Number Pricing
            [
                'key' => 'phone_markup_percentage',
                'value' => '200',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for phone numbers (e.g., 200 = 2x cost)',
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
            // eSIM Pricing
            [
                'key' => 'esim_profile_markup',
                'value' => '100',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM profiles (100 = 2x cost)',
            ],
            [
                'key' => 'esim_data_markup',
                'value' => '150',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM data bundles (150 = 2.5x cost)',
            ],
            [
                'key' => 'esim_auto_sync',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Automatically sync eSIM packages from API daily',
            ],
            [
                'key' => 'esim_low_data_threshold',
                'value' => '20',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send low data warning when usage exceeds this percentage',
            ],
            [
                'key' => 'esim_expiry_warning_days',
                'value' => '3',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send expiry warning this many days before eSIM expires',
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

    /**
     * Get eSIM profile markup percentage
     */
    public static function getEsimProfileMarkup(): float
    {
        return (float) self::getValue('esim_profile_markup', 100);
    }

    /**
     * Get eSIM data bundle markup percentage
     */
    public static function getEsimDataMarkup(): float
    {
        return (float) self::getValue('esim_data_markup', 150);
    }

    /**
     * Get eSIM low data threshold
     */
    public static function getEsimLowDataThreshold(): int
    {
        return (int) self::getValue('esim_low_data_threshold', 20);
    }

    /**
     * Get eSIM expiry warning days
     */
    public static function getEsimExpiryWarningDays(): int
    {
        return (int) self::getValue('esim_expiry_warning_days', 3);
    }

    /**
     * Check if eSIM auto-sync is enabled
     */
    public static function isEsimAutoSyncEnabled(): bool
    {
        return (bool) self::getValue('esim_auto_sync', true);
    }
}
