<?php

namespace Database\Seeders;

use App\Models\ESIMPackage;
use Illuminate\Database\Seeder;

class ESIMTestPackagesSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            // USA Packages
            ['package_code' => 'US_1_7', 'country_code' => 'US', 'country_name' => 'United States', 'region' => 'North America', 'data_amount' => 1024, 'duration_days' => 7, 'network_type' => '4G/5G', 'wholesale_price' => 7080, 'selling_price' => 8496, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => true],
            ['package_code' => 'US_3_30', 'country_code' => 'US', 'country_name' => 'United States', 'region' => 'North America', 'data_amount' => 3072, 'duration_days' => 30, 'network_type' => '4G/5G', 'wholesale_price' => 14160, 'selling_price' => 16992, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => true],
            
            // UK Packages
            ['package_code' => 'GB_1_7', 'country_code' => 'GB', 'country_name' => 'United Kingdom', 'region' => 'Europe', 'data_amount' => 1024, 'duration_days' => 7, 'network_type' => '4G/5G', 'wholesale_price' => 7080, 'selling_price' => 8496, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => true],
            ['package_code' => 'GB_5_30', 'country_code' => 'GB', 'country_name' => 'United Kingdom', 'region' => 'Europe', 'data_amount' => 5120, 'duration_days' => 30, 'network_type' => '4G/5G', 'wholesale_price' => 21240, 'selling_price' => 25488, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => false],
            
            // Nigeria Packages
            ['package_code' => 'NG_2_7', 'country_code' => 'NG', 'country_name' => 'Nigeria', 'region' => 'Africa', 'data_amount' => 2048, 'duration_days' => 7, 'network_type' => '4G/5G', 'wholesale_price' => 10620, 'selling_price' => 12744, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => true],
            
            // UAE Packages
            ['package_code' => 'AE_1_7', 'country_code' => 'AE', 'country_name' => 'United Arab Emirates', 'region' => 'Middle East', 'data_amount' => 1024, 'duration_days' => 7, 'network_type' => '4G/5G', 'wholesale_price' => 8496, 'selling_price' => 10195, 'markup_percentage' => 20, 'package_type' => 'profile', 'is_active' => true, 'is_popular' => false],
        ];

        foreach ($packages as $package) {
            ESIMPackage::updateOrCreate(
                ['package_code' => $package['package_code']],
                $package
            );
        }

        $this->command->info('Created ' . count($packages) . ' test eSIM packages');
    }
}
