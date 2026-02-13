<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'flutterwave' => [
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'webhook_secret' => env('FLUTTERWAVE_WEBHOOK_SECRET'),
    ],

    'cryptomus' => [
        'api_key' => env('CRYPTOMUS_API_KEY'),
        'merchant_id' => env('CRYPTOMUS_MERCHANT_ID'),
        'base_url' => env('CRYPTOMUS_BASE_URL', 'https://api.cryptomus.com/v1'),
    ],

    'korapay' => [
        'public_key' => env('KORAPAY_PUBLIC_KEY'),
        'secret_key' => env('KORAPAY_SECRET_KEY'),
        'encryption_key' => env('KORAPAY_ENCRYPTION_KEY'),
        'base_url' => env('KORAPAY_BASE_URL', 'https://api.korapay.com/merchant/api/v1'),
    ],

    'fivesim' => [
        'api_key' => env('FIVESIM_API_KEY'),
        'base_url' => env('FIVESIM_BASE_URL', 'https://5sim.net/v1'),
        'enabled' => env('FIVESIM_ENABLED', true),
    ],

    'grizzlysms' => [
        'api_key' => env('GRIZZLYSMS_API_KEY'),
        'base_url' => env('GRIZZLYSMS_BASE_URL', 'https://api.grizzlysms.com/stubs/handler_api.php'),
        'enabled' => env('GRIZZLYSMS_ENABLED', true),
    ],

    'peakerr' => [
        'api_key' => env('PEAKERR_API_KEY'),
        'base_url' => env('PEAKERR_BASE_URL', 'https://peakerr.com/api/v2'),
    ],

    'jap' => [
        'api_key' => env('JAP_API_KEY'),
        'base_url' => env('JAP_BASE_URL', 'https://justanotherpanel.com/api/v2'),
        'enabled' => env('JAP_ENABLED', true),
    ],

];
