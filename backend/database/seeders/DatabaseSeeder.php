<?php

namespace Database\Seeders;

use App\Models\Service;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Initialize default settings
        Setting::initializeDefaults();
        // Create admin user
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@tonicstools.com',
            'phone' => '+2348000000000',
            'password' => Hash::make('Admin@123'),
            'role' => 'admin',
            'balance' => 0,
            'is_active' => true,
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Create test user
        User::create([
            'name' => 'Test User',
            'email' => 'test@tonicstools.com',
            'phone' => '+2348000000001',
            'password' => Hash::make('Test@123'),
            'role' => 'customer',
            'balance' => 5000,
            'is_active' => true,
            'email_verified' => true,
            'email_verified_at' => now(),
        ]);

        // Create sample phone services
        $phoneServices = [
            ['name' => 'WhatsApp', 'code' => 'whatsapp', 'cost' => 150, 'retail' => 350],
            ['name' => 'Telegram', 'code' => 'telegram', 'cost' => 120, 'retail' => 300],
            ['name' => 'Facebook', 'code' => 'facebook', 'cost' => 100, 'retail' => 280],
            ['name' => 'Instagram', 'code' => 'instagram', 'cost' => 120, 'retail' => 300],
            ['name' => 'Twitter/X', 'code' => 'twitter', 'cost' => 150, 'retail' => 350],
            ['name' => 'TikTok', 'code' => 'tiktok', 'cost' => 180, 'retail' => 400],
            ['name' => 'Google/Gmail', 'code' => 'google', 'cost' => 150, 'retail' => 350],
            ['name' => 'Microsoft/Outlook', 'code' => 'microsoft', 'cost' => 120, 'retail' => 300],
            ['name' => 'Yahoo', 'code' => 'yahoo', 'cost' => 100, 'retail' => 280],
            ['name' => 'Amazon', 'code' => 'amazon', 'cost' => 180, 'retail' => 400],
            ['name' => 'Netflix', 'code' => 'netflix', 'cost' => 200, 'retail' => 450],
            ['name' => 'Spotify', 'code' => 'spotify', 'cost' => 150, 'retail' => 350],
            ['name' => 'Discord', 'code' => 'discord', 'cost' => 130, 'retail' => 320],
            ['name' => 'Snapchat', 'code' => 'snapchat', 'cost' => 160, 'retail' => 380],
            ['name' => 'LinkedIn', 'code' => 'linkedin', 'cost' => 180, 'retail' => 400],
            ['name' => 'PayPal', 'code' => 'paypal', 'cost' => 220, 'retail' => 500],
            ['name' => 'Binance', 'code' => 'binance', 'cost' => 250, 'retail' => 550],
            ['name' => 'Uber', 'code' => 'uber', 'cost' => 150, 'retail' => 350],
            ['name' => 'Bolt', 'code' => 'bolt', 'cost' => 130, 'retail' => 320],
            ['name' => 'OPay', 'code' => 'opay', 'cost' => 180, 'retail' => 400],
        ];

        foreach ($phoneServices as $service) {
            Service::create([
                'category' => 'phone_number',
                'name' => $service['name'],
                'provider' => '5sim',
                'provider_service_code' => $service['code'],
                'cost_price' => $service['cost'],
                'retail_price' => $service['retail'],
                'reseller_price' => round($service['retail'] * 0.85, 2),
                'is_active' => true,
                'metadata' => [
                    'description' => "Phone verification for {$service['name']}",
                    'country' => 'nigeria',
                ],
            ]);
        }
    }
}
