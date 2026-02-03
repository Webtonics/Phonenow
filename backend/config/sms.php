<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default SMS Provider
    |--------------------------------------------------------------------------
    |
    | The default provider to use when no specific provider is requested.
    | Supported: "5sim", "grizzlysms"
    |
    */
    'default_provider' => env('SMS_DEFAULT_PROVIDER', '5sim'),

    /*
    |--------------------------------------------------------------------------
    | Provider Selection Strategy
    |--------------------------------------------------------------------------
    |
    | Strategy for auto-selecting provider when user doesn't specify.
    | Supported: "cheapest", "most_available", "highest_success", "default"
    |
    */
    'selection_strategy' => env('SMS_SELECTION_STRATEGY', 'cheapest'),

    /*
    |--------------------------------------------------------------------------
    | Allow User Provider Selection
    |--------------------------------------------------------------------------
    |
    | Whether to allow users to choose their preferred provider at purchase.
    |
    */
    'allow_user_selection' => env('SMS_ALLOW_USER_SELECTION', true),

    /*
    |--------------------------------------------------------------------------
    | Price Display Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for how prices are displayed to users.
    |
    */
    'pricing' => [
        'show_provider_prices' => env('SMS_SHOW_PROVIDER_PRICES', true),
        'aggregate_prices' => env('SMS_AGGREGATE_PRICES', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | SMS Polling Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for background SMS status polling.
    |
    */
    'polling' => [
        'interval_seconds' => env('SMS_POLL_INTERVAL', 15),
        'max_attempts' => env('SMS_POLL_MAX_ATTEMPTS', 80),
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (seconds)
    |--------------------------------------------------------------------------
    |
    | Cache duration for various data types.
    |
    */
    'cache' => [
        'countries' => 3600,      // 1 hour
        'products' => 1800,       // 30 minutes
        'prices' => 300,          // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Expiration
    |--------------------------------------------------------------------------
    |
    | Default expiration time for phone number orders in minutes.
    |
    */
    'order_expiration_minutes' => env('SMS_ORDER_EXPIRATION', 20),

];
