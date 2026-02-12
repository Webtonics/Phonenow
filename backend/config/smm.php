<?php

return [
    /*
    |--------------------------------------------------------------------------
    | SMM Panel Configuration
    |--------------------------------------------------------------------------
    */

    // Default markup percentage (50% = 1.5x the cost)
    'default_markup' => env('SMM_DEFAULT_MARKUP', 50),

    // Order status update frequency (minutes)
    'update_frequency' => env('SMM_UPDATE_FREQUENCY', 5),

    // Service sync frequency (hours)
    'sync_frequency' => env('SMM_SYNC_FREQUENCY', 24),

    // Enable/disable SMM services
    'enabled' => env('SMM_ENABLED', true),
];
