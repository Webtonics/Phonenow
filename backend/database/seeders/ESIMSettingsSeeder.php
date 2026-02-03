<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class ESIMSettingsSeeder extends Seeder
{
    /**
     * Seed eSIM-related settings
     */
    public function run(): void
    {
        $settings = [
            // eSIM Pricing Settings
            [
                'key' => 'esim_profile_markup',
                'value' => '100',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM profiles (100 = 2x wholesale cost)',
            ],
            [
                'key' => 'esim_data_markup',
                'value' => '150',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM data bundles (150 = 2.5x wholesale cost)',
            ],

            // eSIM Configuration
            [
                'key' => 'esim_auto_sync',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Automatically sync eSIM packages from API daily',
            ],
            [
                'key' => 'esim_sync_frequency_hours',
                'value' => '24',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'How often to sync eSIM packages (in hours)',
            ],

            // eSIM Notifications
            [
                'key' => 'esim_low_data_threshold',
                'value' => '20',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send low data warning when remaining data drops below this percentage',
            ],
            [
                'key' => 'esim_expiry_warning_days',
                'value' => '3',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send expiry warning this many days before eSIM expires',
            ],
            [
                'key' => 'esim_enable_usage_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Enable email notifications for low data and expiry warnings',
            ],

            // eSIM Features
            [
                'key' => 'esim_enable_auto_topup',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Enable automatic top-up when data is low (future feature)',
            ],
            [
                'key' => 'esim_min_purchase_amount',
                'value' => '1000',
                'type' => 'float',
                'group' => 'esim',
                'description' => 'Minimum amount for eSIM purchases in NGN',
            ],
            [
                'key' => 'esim_max_profiles_per_user',
                'value' => '10',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Maximum number of active eSIM profiles per user (0 = unlimited)',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('eSIM settings initialized successfully!');
    }
}
