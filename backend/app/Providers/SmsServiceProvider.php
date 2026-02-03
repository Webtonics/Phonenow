<?php

namespace App\Providers;

use App\Contracts\SmsProviderInterface;
use App\Services\SmsProviderManager;
use App\Services\SmsProviders\FiveSimProvider;
use App\Services\SmsProviders\GrizzlySmsProvider;
use Illuminate\Support\ServiceProvider;

class SmsServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register individual providers as singletons
        $this->app->singleton(FiveSimProvider::class);
        $this->app->singleton(GrizzlySmsProvider::class);

        // Register the provider manager as singleton
        $this->app->singleton(SmsProviderManager::class);

        // Bind the interface to the default provider through the manager
        $this->app->bind(SmsProviderInterface::class, function ($app) {
            return $app->make(SmsProviderManager::class)->getDefault();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Merge config
        $this->mergeConfigFrom(
            __DIR__ . '/../../config/sms.php',
            'sms'
        );
    }
}
