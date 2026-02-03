<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $settings = [
            // eSIM Pricing Settings
            [
                'key' => 'esim_profile_markup',
                'value' => '100',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM profiles (100 = 2x wholesale cost)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_data_markup',
                'value' => '150',
                'type' => 'float',
                'group' => 'pricing',
                'description' => 'Markup percentage for eSIM data bundles (150 = 2.5x wholesale cost)',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // eSIM Configuration
            [
                'key' => 'esim_auto_sync',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Automatically sync eSIM packages from API daily',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_sync_frequency_hours',
                'value' => '24',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'How often to sync eSIM packages (in hours)',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // eSIM Notifications
            [
                'key' => 'esim_low_data_threshold',
                'value' => '20',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send low data warning when remaining data drops below this percentage',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_expiry_warning_days',
                'value' => '3',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Send expiry warning this many days before eSIM expires',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_enable_usage_notifications',
                'value' => '1',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Enable email notifications for low data and expiry warnings',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // eSIM Features
            [
                'key' => 'esim_enable_auto_topup',
                'value' => '0',
                'type' => 'boolean',
                'group' => 'esim',
                'description' => 'Enable automatic top-up when data is low (future feature)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_min_purchase_amount',
                'value' => '1000',
                'type' => 'float',
                'group' => 'esim',
                'description' => 'Minimum amount for eSIM purchases in NGN',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'esim_max_profiles_per_user',
                'value' => '10',
                'type' => 'integer',
                'group' => 'esim',
                'description' => 'Maximum number of active eSIM profiles per user (0 = unlimited)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($settings as $setting) {
            // Check if setting already exists
            $exists = DB::table('settings')->where('key', $setting['key'])->exists();

            if (!$exists) {
                DB::table('settings')->insert($setting);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $keys = [
            'esim_profile_markup',
            'esim_data_markup',
            'esim_auto_sync',
            'esim_sync_frequency_hours',
            'esim_low_data_threshold',
            'esim_expiry_warning_days',
            'esim_enable_usage_notifications',
            'esim_enable_auto_topup',
            'esim_min_purchase_amount',
            'esim_max_profiles_per_user',
        ];

        DB::table('settings')->whereIn('key', $keys)->delete();
    }
};
