<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Transaction Expiry Time
    |--------------------------------------------------------------------------
    |
    | Number of minutes before a pending transaction automatically expires.
    | This applies to wallet funding transactions that were never completed.
    |
    */
    'expiry_minutes' => env('TRANSACTION_EXPIRY_MINUTES', 60),
];
