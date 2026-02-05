<?php

use App\Jobs\ProcessExpiredOrdersJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule jobs
Schedule::job(new ProcessExpiredOrdersJob())
    ->everyFiveMinutes()
    ->name('process-expired-orders')
    ->withoutOverlapping();

Schedule::job(new \App\Jobs\FetchExchangeRatesJob())
    ->hourly()
    ->name('fetch-exchange-rates')
    ->withoutOverlapping();

Schedule::job(new \App\Jobs\SyncESimPackagesJob())
    ->daily()
    ->name('sync-esim-packages')
    ->withoutOverlapping();
