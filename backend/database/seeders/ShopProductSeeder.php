<?php

namespace Database\Seeders;

use App\Models\ShopProduct;
use Illuminate\Database\Seeder;

class ShopProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name' => 'NordVPN Basic - 1 Month',
                'description' => 'Genuine NordVPN Basic subscription for 1 month. 10 devices, 6300+ servers, 111 locations. No dollar card needed.',
                'category' => 'vpn',
                'duration_days' => 30,
                'duration_label' => '1 Month',
                'wholesale_cost' => 13120.00,
                'selling_price' => 18000.00,
                'sort_order' => 0,
            ],
            [
                'name' => 'NordVPN Basic - 1 Year',
                'description' => 'Genuine NordVPN Basic subscription for 1 year. Best value. 10 devices, 6300+ servers, 111 locations.',
                'category' => 'vpn',
                'duration_days' => 365,
                'duration_label' => '1 Year',
                'wholesale_cost' => 32800.00,
                'selling_price' => 55000.00,
                'sort_order' => 1,
            ],
            [
                'name' => 'NordVPN Plus - 1 Year',
                'description' => 'NordVPN Plus with NordPass password manager included. 1 year subscription. 10 devices.',
                'category' => 'vpn',
                'duration_days' => 365,
                'duration_label' => '1 Year',
                'wholesale_cost' => 57400.00,
                'selling_price' => 85000.00,
                'sort_order' => 2,
            ],
        ];

        foreach ($products as $product) {
            ShopProduct::updateOrCreate(
                ['name' => $product['name']],
                $product
            );
        }
    }
}
