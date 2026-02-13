<?php

namespace App\Console\Commands;

use App\Services\SmmProviders\JapProvider;
use Illuminate\Console\Command;

class TestJapConnection extends Command
{
    protected $signature = 'smm:test-jap';
    protected $description = 'Test JustAnotherPanel API connection';

    public function handle(JapProvider $provider): int
    {
        $this->info('Testing JAP API connection...');
        $this->info('API Key: ' . substr($provider->getIdentifier(), 0, 10) . '...');
        $this->info('Enabled: ' . ($provider->isEnabled() ? 'Yes' : 'No'));
        $this->info('Configured: ' . ($provider->isConfigured() ? 'Yes' : 'No'));

        $this->newLine();
        $this->info('Fetching balance...');

        $balanceResult = $provider->getBalance();

        if ($balanceResult['success']) {
            $this->info('✓ Balance: ' . $balanceResult['balance'] . ' ' . $balanceResult['currency']);
        } else {
            $this->error('✗ Failed: ' . $balanceResult['message']);
        }

        $this->newLine();
        $this->info('Fetching services...');

        $services = $provider->getServices();
        $count = $services->count();

        $this->info("✓ Found {$count} services");

        if ($count > 0) {
            $this->newLine();
            $this->info('Sample services:');
            $services->take(5)->each(function ($service) {
                $this->line("  - {$service['name']} (Category: {$service['category']}, Rate: {$service['rate']})");
            });
        }

        return self::SUCCESS;
    }
}
