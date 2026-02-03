<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Zendit API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for integrating with Zendit eSIM API.
    | Documentation: https://developers.zendit.io/api/
    |
    | NOTE: Most pricing settings are stored in the database (settings table)
    | and can be managed through the admin panel.
    |
    */

    'api_url' => env('ZENDIT_API_URL', 'https://api.zendit.io/v1'),

    'api_key' => env('ZENDIT_API_KEY'),

    'environment' => env('ZENDIT_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Webhook Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the webhook secret for verifying incoming webhooks from Zendit.
    | Generate a long, random string and configure it in Zendit console.
    | See: https://developers.zendit.io/zendit-concepts/webhooks/
    |
    */

    'webhook_secret' => env('ZENDIT_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | API Request Settings
    |--------------------------------------------------------------------------
    */

    'timeout' => env('ZENDIT_TIMEOUT', 30), // seconds for normal requests

    'sync_timeout' => env('ZENDIT_SYNC_TIMEOUT', 120), // seconds for sync operations

    'retry_times' => env('ZENDIT_RETRY_TIMES', 3),

    'retry_sleep' => env('ZENDIT_RETRY_SLEEP', 2000), // milliseconds between retries

    /*
    |--------------------------------------------------------------------------
    | Pagination Settings
    |--------------------------------------------------------------------------
    */

    'chunk_size' => env('ZENDIT_CHUNK_SIZE', 50), // Smaller chunks for reliable syncing

    'default_limit' => 100,
    'max_limit' => 1024,

    /*
    |--------------------------------------------------------------------------
    | Caching Settings
    |--------------------------------------------------------------------------
    */

    'cache' => [
        'offers_ttl' => 3600, // 1 hour
        'countries_ttl' => 86400, // 24 hours
        'balance_ttl' => 300, // 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Pricing Settings (defaults, can be overridden in DB)
    |--------------------------------------------------------------------------
    */

    'pricing' => [
        'profile_markup' => env('ESIM_PROFILE_MARKUP', 100), // 100% markup = 2x cost
        'data_markup' => env('ESIM_DATA_MARKUP', 150), // 150% markup = 2.5x cost
        'usd_to_ngn' => env('ESIM_USD_TO_NGN', 1600), // Fallback exchange rate
    ],

    /*
    |--------------------------------------------------------------------------
    | QR Code Settings
    |--------------------------------------------------------------------------
    */

    'qr_code' => [
        'size' => 400, // pixels
        'format' => 'png',
        'storage_path' => 'esim/qr-codes',
    ],

    /*
    |--------------------------------------------------------------------------
    | Transaction Status Mapping
    |--------------------------------------------------------------------------
    | Maps Zendit statuses to internal application statuses
    */

    'status_map' => [
        'DONE' => 'active',
        'FAILED' => 'failed',
        'PENDING' => 'pending',
        'ACCEPTED' => 'pending',
        'AUTHORIZED' => 'pending',
        'IN_PROGRESS' => 'processing',
    ],

    /*
    |--------------------------------------------------------------------------
    | Regions (Zendit API regions)
    |--------------------------------------------------------------------------
    */

    'regions' => [
        'Global',
        'Africa',
        'Asia',
        'Caribbean',
        'Central America',
        'Europe',
        'Middle East',
        'North America',
        'Oceania',
        'South America',
    ],

    /*
    |--------------------------------------------------------------------------
    | Popular Countries (UI Enhancement)
    |--------------------------------------------------------------------------
    |
    | These countries will be highlighted in the UI
    |
    */

    'popular_countries' => [
        'US', // United States
        'GB', // United Kingdom
        'CA', // Canada
        'AU', // Australia
        'DE', // Germany
        'FR', // France
        'ES', // Spain
        'IT', // Italy
        'JP', // Japan
        'AE', // United Arab Emirates
        'NG', // Nigeria
        'SG', // Singapore
        'TH', // Thailand
    ],

    /*
    |--------------------------------------------------------------------------
    | Data Speed Types
    |--------------------------------------------------------------------------
    */

    'data_speeds' => [
        '2G',
        '3G',
        '4G',
        '5G',
    ],

    /*
    |--------------------------------------------------------------------------
    | Auto-sync Settings
    |--------------------------------------------------------------------------
    */

    'auto_sync' => env('ESIM_AUTO_SYNC', true),
    'sync_interval' => 3600, // 1 hour

];
