<?php

namespace App\Console\Commands;

use App\Services\SmmManager;
use Illuminate\Console\Command;

class SyncSmmServices extends Command
{
    protected $signature = 'smm:sync-services';
    protected $description = 'Sync SMM services from all providers';

    public function handle(SmmManager $smmManager): int
    {
        $this->info('Syncing SMM services from providers...');

        $results = $smmManager->syncServices();

        foreach ($results as $provider => $result) {
            if ($result['success']) {
                $this->info("✓ {$result['message']}");
            } else {
                $this->error("✗ {$result['message']}");
            }
        }

        $totalSynced = array_sum(array_column($results, 'synced'));
        $this->info("\nTotal services synced: {$totalSynced}");

        return self::SUCCESS;
    }
}
